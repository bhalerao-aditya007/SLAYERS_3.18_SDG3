# First, install required packages if not already installed
# In Kaggle, you can use pip in a cell or add these to requirements
# !pip install PyPDF2 pandas

import PyPDF2
import re
import json
import pandas as pd
from typing import List, Dict, Any
import csv

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            print(f"Extracting text from {num_pages} pages...")
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                text += f"===== Page {page_num} =====\n{page_text}\n\n"
                
            print(f"Text extraction complete. Total characters: {len(text)}")
            
    except Exception as e:
        print(f"Error reading PDF: {e}")
    
    return text

def extract_drug_interactions_from_text(pdf_text: str):
    """Extract drug interaction data from the PDF text content"""
    
    # Parse the PDF content by pages
    pages = {}
    page_sections = pdf_text.split("===== Page")
    
    for section in page_sections[1:]:  # Skip first empty
        page_match = re.search(r'(\d+)\s*=====', section)
        if page_match:
            page_num = page_match.group(1)
            content = section[page_match.end():].strip()
            pages[page_num] = content
    
    print(f"Parsed {len(pages)} pages")
    
    # Initialize data structures
    arv_drug_interactions = []
    common_med_interactions = []
    drug_mechanisms = []
    
    # Extract all table-like structures
    all_tables = []
    
    # Look for tables in the text
    for page_num, content in pages.items():
        # Look for table headers
        table_patterns = [
            r'Table\s+(\d+[A-Z]?):\s+([^(]+?)\s+Interactions',
            r'Table\s+(\d+):\s+([^\(]+?)\s+\(see',
            r'Table\s+(\d+):\s+([^\(]+)'
        ]
        
        for pattern in table_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
            for match in matches:
                table_num = match.group(1).strip()
                table_name = match.group(2).strip()
                
                # Get table content (text after the header until next table or section)
                start_pos = match.end()
                next_table = re.search(r'Table\s+\d+[A-Z]?:', content[start_pos:])
                
                if next_table:
                    table_content = content[start_pos:start_pos + next_table.start()]
                else:
                    table_content = content[start_pos:]
                
                all_tables.append({
                    'page': page_num,
                    'table_num': table_num,
                    'name': table_name,
                    'content': table_content[:500]  # First 500 chars
                })
    
    print(f"Found {len(all_tables)} potential tables")
    
    # Process ARV drug tables (Tables 3-19)
    arv_table_numbers = [str(i) for i in range(3, 20)] + ['19A', '19B']
    
    for table in all_tables:
        if any(table['table_num'].startswith(num) for num in arv_table_numbers):
            print(f"Processing ARV table {table['table_num']}: {table['name'][:50]}...")
            
            # Parse this ARV table
            rows = parse_arv_table(table['content'])
            for row in rows:
                if row.get('drug_class'):
                    arv_drug_interactions.append({
                        'table_number': table['table_num'],
                        'table_name': table['name'],
                        'page': table['page'],
                        'interacting_drug_class': row['drug_class'],
                        'mechanism': row.get('mechanism', ''),
                        'clinical_comments': row.get('clinical_comments', ''),
                        'arv_drug': extract_arv_drug_from_name(table['name'])
                    })
    
    # Process common medication tables (Tables 20-30)
    common_table_numbers = [str(i) for i in range(20, 31)]
    
    for table in all_tables:
        if any(table['table_num'] == num for num in common_table_numbers):
            print(f"Processing common med table {table['table_num']}: {table['name'][:50]}...")
            
            # Parse this common medication table
            rows = parse_common_med_table(table['content'])
            for row in rows:
                if row:
                    common_med_interactions.append({
                        'table_number': table['table_num'],
                        'table_name': table['name'],
                        'page': table['page'],
                        **row
                    })
    
    # Extract key drug information
    drug_mechanisms = extract_drug_mechanisms(pages)
    
    return {
        'arv_drug_interactions': arv_drug_interactions,
        'common_med_interactions': common_med_interactions,
        'drug_mechanisms': drug_mechanisms,
        'tables_found': all_tables
    }

def parse_arv_table(table_text: str) -> List[Dict[str, str]]:
    """Parse ARV drug interaction table"""
    rows = []
    lines = table_text.split('\n')
    
    current_drug_class = ""
    current_mechanism = ""
    current_comments = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Look for drug class entries (usually capitalized, not bullet points)
        if (len(line) > 3 and 
            line[0].isalpha() and 
            not line.startswith('•') and
            not line.startswith('Abbreviation') and
            'CYP' not in line and
            'P-gP' not in line):
            
            # Save previous row
            if current_drug_class and (current_mechanism or current_comments):
                rows.append({
                    'drug_class': current_drug_class,
                    'mechanism': current_mechanism,
                    'clinical_comments': current_comments
                })
                current_mechanism = ""
                current_comments = ""
            
            current_drug_class = line
        
        # Look for mechanism (often contains CYP, P-gP, or other enzyme terms)
        elif ('CYP' in line or 'P-gP' in line or 'inhib' in line.lower() or 
              'induc' in line.lower() or 'metabol' in line.lower()):
            if not current_mechanism:
                current_mechanism = line
            else:
                current_mechanism += " " + line
        
        # Clinical comments often contain action words
        elif ('avoid' in line.lower() or 'monitor' in line.lower() or 
              'dose' in line.lower() or 'use' in line.lower() or
              'consider' in line.lower() or 'administer' in line.lower()):
            if not current_comments:
                current_comments = line
            else:
                current_comments += " " + line
    
    # Add the last row
    if current_drug_class and (current_mechanism or current_comments):
        rows.append({
            'drug_class': current_drug_class,
            'mechanism': current_mechanism,
            'clinical_comments': current_comments
        })
    
    return rows

def parse_common_med_table(table_text: str) -> List[Dict[str, str]]:
    """Parse common medication table"""
    rows = []
    lines = table_text.split('\n')
    
    current_arv = ""
    current_details = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Look for ARV entries (often have parentheses or abbreviations)
        if (('NRTI' in line or 'INSTI' in line or 'PI' in line or 
             'NNRTI' in line) or
            re.search(r'\([A-Z]+\)', line)):
            
            # Save previous row
            if current_arv and current_details:
                rows.append({
                    'arv_drugs': current_arv,
                    'interaction_details': current_details
                })
                current_details = ""
            
            current_arv = line
        
        # Interaction details
        elif current_arv and line:
            current_details += " " + line
    
    # Add last row
    if current_arv and current_details:
        rows.append({
            'arv_drugs': current_arv,
            'interaction_details': current_details
        })
    
    return rows

def extract_arv_drug_from_name(table_name: str) -> str:
    """Extract ARV drug name from table name"""
    # Common ARV drug patterns
    patterns = [
        r'Atazanavir\s*\(ATV\)',
        r'Darunavir\s*\(DRV\)',
        r'Bictegravir\s*\(BIC\)',
        r'Cabotegravir\s*\(CAB\)',
        r'Dolutegravir\s*\(DTG\)',
        r'Elvitegravir\s*\(EVG\)',
        r'Raltegravir\s*\(RAL\)',
        r'Doravirine\s*\(DOR\)',
        r'Rilpivirine\s*\(RPV\)',
        r'Efavirenz\s*\(EFV\)',
        r'Etravirine\s*\(ETR\)',
        r'Abacavir\s*\(ABC\)',
        r'Tenofovir',
        r'Lamivudine',
        r'Emtricitabine',
        r'Fostemsavir\s*\(FTR\)',
        r'Maraviroc\s*\(MVC\)',
        r'Lenacapavir\s*\(LEN\)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, table_name, re.IGNORECASE)
        if match:
            return match.group(0)
    
    # If no pattern matched, return the table name
    return table_name

def extract_drug_mechanisms(pages: Dict[str, str]) -> List[Dict[str, Any]]:
    """Extract drug mechanism information"""
    mechanisms = []
    
    # Look for drug class sections
    drug_classes = [
        "Integrase Strand Transfer Inhibitors",
        "Protease Inhibitors",
        "Non-Nucleoside Reverse Transcriptase Inhibitors",
        "Nucleoside Reverse Transcriptase Inhibitors",
        "Entry Inhibitors",
        "Capsid Inhibitor"
    ]
    
    for page_num, content in pages.items():
        # Look for drug abbreviations and their mechanisms
        drug_pattern = r'\b([A-Z]{2,4})\b'
        drugs = re.findall(drug_pattern, content)
        
        # Filter common ARV drug abbreviations
        common_arvs = ['ATV', 'DRV', 'BIC', 'CAB', 'DTG', 'EVG', 'RAL', 
                      'DOR', 'RPV', 'EFV', 'ETR', 'ABC', 'FTC', '3TC', 
                      'TAF', 'TDF', 'FTR', 'MVC', 'LEN', 'COBI', 'RTV']
        
        for drug in drugs:
            if drug in common_arvs:
                # Get context around the drug
                start = max(0, content.find(drug) - 100)
                end = min(len(content), content.find(drug) + 100)
                context = content[start:end]
                
                mechanisms.append({
                    'drug_abbreviation': drug,
                    'page': page_num,
                    'context': context.strip()
                })
    
    return mechanisms

def create_drug_class_mapping() -> Dict[str, Dict]:
    """Create a mapping of ARV drug classes and their drugs"""
    return {
        "Integrase Strand Transfer Inhibitors (INSTIs)": {
            "drugs": ["Bictegravir (BIC)", "Cabotegravir (CAB)", "Dolutegravir (DTG)", 
                     "Elvitegravir (EVG)", "Raltegravir (RAL)"],
            "description": "Block HIV integration into host DNA"
        },
        "Boosted Protease Inhibitors (PIs)": {
            "drugs": ["Atazanavir (ATV)", "Darunavir (DRV)"],
            "description": "Inhibit HIV protease enzyme, often boosted with COBI/RTV"
        },
        "Non-Nucleoside Reverse Transcriptase Inhibitors (NNRTIs)": {
            "drugs": ["Doravirine (DOR)", "Rilpivirine (RPV)", "Efavirenz (EFV)", 
                     "Etravirine (ETR)", "Nevirapine (NVP)"],
            "description": "Bind to and alter reverse transcriptase"
        },
        "Nucleoside Reverse Transcriptase Inhibitors (NRTIs)": {
            "drugs": ["Abacavir (ABC)", "Tenofovir (TDF/TAF)", "Lamivudine (3TC)", 
                     "Emtricitabine (FTC)"],
            "description": "Competitive inhibitors of reverse transcriptase"
        },
        "Entry Inhibitors": {
            "drugs": ["Fostemsavir (FTR)", "Maraviroc (MVC)"],
            "description": "Block HIV entry into cells"
        },
        "Capsid Inhibitor": {
            "drugs": ["Lenacapavir (LEN)"],
            "description": "Interfere with HIV capsid protein"
        },
        "Pharmacokinetic Enhancers": {
            "drugs": ["Cobicistat (COBI)", "Ritonavir (RTV)"],
            "description": "Boost levels of other ARVs by inhibiting metabolism"
        }
    }

def save_to_csv(data: Dict[str, List[Dict]], output_prefix: str):
    """Save extracted data to CSV files"""
    
    # Save ARV drug interactions
    if data['arv_drug_interactions']:
        df_arv = pd.DataFrame(data['arv_drug_interactions'])
        df_arv.to_csv(f'{output_prefix}_arv_interactions.csv', index=False, encoding='utf-8')
        print(f"✓ Saved {len(df_arv)} ARV drug interactions to {output_prefix}_arv_interactions.csv")
    
    # Save common medication interactions
    if data['common_med_interactions']:
        df_common = pd.DataFrame(data['common_med_interactions'])
        df_common.to_csv(f'{output_prefix}_common_med_interactions.csv', index=False, encoding='utf-8')
        print(f"✓ Saved {len(df_common)} common medication interactions to {output_prefix}_common_med_interactions.csv")
    
    # Save drug mechanisms
    if data['drug_mechanisms']:
        df_mech = pd.DataFrame(data['drug_mechanisms'])
        df_mech.to_csv(f'{output_prefix}_drug_mechanisms.csv', index=False, encoding='utf-8')
        print(f"✓ Saved {len(df_mech)} drug mechanisms to {output_prefix}_drug_mechanisms.csv")
    
    # Save tables found
    if data.get('tables_found'):
        df_tables = pd.DataFrame(data['tables_found'])
        df_tables.to_csv(f'{output_prefix}_tables_found.csv', index=False, encoding='utf-8')
        print(f"✓ Saved {len(df_tables)} tables metadata to {output_prefix}_tables_found.csv")

def save_to_json(data: Dict[str, List[Dict]], output_file: str):
    """Save all data to JSON file"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved complete data to {output_file}")

def main():
    """Main function to extract and save drug interaction data"""
    
    # Path to your PDF file in Kaggle
    pdf_path = '/kaggle/input/hivdrug/NYSDOH-AI-Drug-Drug-Interaction-Guide_10-7-2025_HG.pdf'
    
    print(f"Reading PDF from: {pdf_path}")
    
    # Step 1: Extract text from PDF
    pdf_text = extract_text_from_pdf(pdf_path)
    
    if not pdf_text:
        print("Error: Could not extract text from PDF")
        return
    
    # Save extracted text for debugging
    with open('extracted_pdf_text.txt', 'w', encoding='utf-8') as f:
        f.write(pdf_text[:10000])  # Save first 10k chars for inspection
    print("✓ Saved sample extracted text to extracted_pdf_text.txt")
    
    # Step 2: Extract drug interaction data
    print("\n" + "="*60)
    print("EXTRACTING DRUG INTERACTION DATA")
    print("="*60)
    
    extracted_data = extract_drug_interactions_from_text(pdf_text)
    
    # Add drug class mapping
    extracted_data['drug_class_mapping'] = create_drug_class_mapping()
    
    # Step 3: Save to files
    print("\n" + "="*60)
    print("SAVING DATA TO FILES")
    print("="*60)
    
    save_to_csv(extracted_data, 'hiv_drug_interactions')
    save_to_json(extracted_data, 'hiv_drug_interactions_complete.json')
    
    # Step 4: Create summary report
    print("\n" + "="*60)
    print("EXTRACTION SUMMARY")
    print("="*60)
    print(f"ARV Drug Interactions: {len(extracted_data['arv_drug_interactions'])} records")
    print(f"Common Medication Interactions: {len(extracted_data['common_med_interactions'])} records")
    print(f"Drug Mechanisms: {len(extracted_data['drug_mechanisms'])} records")
    print(f"Tables Found: {len(extracted_data.get('tables_found', []))}")
    
    # Display sample data
    if extracted_data['arv_drug_interactions']:
        print("\n" + "="*60)
        print("SAMPLE ARV DRUG INTERACTIONS")
        print("="*60)
        for i, interaction in enumerate(extracted_data['arv_drug_interactions'][:5]):
            print(f"\nSample {i+1}:")
            print(f"  ARV Drug: {interaction.get('arv_drug', 'N/A')}")
            print(f"  Interacting Class: {interaction.get('interacting_drug_class', 'N/A')[:80]}...")
            print(f"  Mechanism: {interaction.get('mechanism', 'N/A')[:80]}...")
    
    # Create a simplified summary CSV
    create_summary_files(extracted_data)
    
    return extracted_data

def create_summary_files(data: Dict[str, List[Dict]]):
    """Create summary and simplified files for easy analysis"""
    
    # Create unique drugs list
    unique_drugs = set()
    for interaction in data['arv_drug_interactions']:
        if 'arv_drug' in interaction:
            unique_drugs.add(interaction['arv_drug'])
    
    # Save unique drugs
    with open('hiv_drug_interactions_unique_drugs.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ARV_Drug'])
        for drug in sorted(unique_drugs):
            writer.writerow([drug])
    
    print(f"\n✓ Saved {len(unique_drugs)} unique ARV drugs to hiv_drug_interactions_unique_drugs.csv")
    
    # Create interaction counts by drug
    drug_counts = {}
    for interaction in data['arv_drug_interactions']:
        drug = interaction.get('arv_drug', 'Unknown')
        drug_counts[drug] = drug_counts.get(drug, 0) + 1
    
    # Save drug interaction counts
    with open('hiv_drug_interaction_counts.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ARV_Drug', 'Interaction_Count'])
        for drug, count in sorted(drug_counts.items(), key=lambda x: x[1], reverse=True):
            writer.writerow([drug, count])
    
    print(f"✓ Saved drug interaction counts to hiv_drug_interaction_counts.csv")
    
    # Create simplified JSON with just key information
    simplified_data = {
        'drug_classes': data['drug_class_mapping'],
        'unique_drugs': list(unique_drugs),
        'interaction_counts': drug_counts,
        'total_interactions': len(data['arv_drug_interactions']),
        'total_common_interactions': len(data['common_med_interactions'])
    }
    
    with open('hiv_drug_interactions_summary.json', 'w', encoding='utf-8') as f:
        json.dump(simplified_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved summary data to hiv_drug_interactions_summary.json")

if __name__ == "__main__":
    print("="*60)
    print("HIV DRUG INTERACTION DATA EXTRACTOR")
    print("="*60)
    print("Starting extraction process...\n")
    
    data = main()
    
    print("\n" + "="*60)
    print("EXTRACTION COMPLETE!")
    print("="*60)
    print("\nFiles created:")
    print("1. hiv_drug_interactions_arv_interactions.csv")
    print("2. hiv_drug_interactions_common_med_interactions.csv")
    print("3. hiv_drug_interactions_drug_mechanisms.csv")
    print("4. hiv_drug_interactions_tables_found.csv")
    print("5. hiv_drug_interactions_complete.json")
    print("6. hiv_drug_interactions_summary.json")
    print("7. hiv_drug_interactions_unique_drugs.csv")
    print("8. hiv_drug_interaction_counts.csv")
    print("9. extracted_pdf_text.txt (sample)")
