import Papa from 'papaparse';
import type { DrugInteraction, DrugInteractionCount, PKSimulation, CYPPathway } from '@/types';

// Cache for loaded data
const dataCache: Record<string, unknown> = {};

export async function loadCSV<T>(filename: string): Promise<T[]> {
  if (dataCache[filename]) {
    return dataCache[filename] as T[];
  }

  const response = await fetch(`/data/${filename}`);
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        dataCache[filename] = results.data;
        resolve(results.data as T[]);
      },
      error: (error: Error) => reject(error)
    });
  });
}

export async function loadJSON<T>(filename: string): Promise<T> {
  if (dataCache[filename]) {
    return dataCache[filename] as T;
  }

  const response = await fetch(`/data/${filename}`);
  const data = await response.json();
  dataCache[filename] = data;
  return data;
}

// Load drug interaction counts
export async function loadInteractionCounts(): Promise<DrugInteractionCount[]> {
  const data = await loadCSV<Record<string, string>>('hiv_drug_interaction_counts.csv');
  return data.map(row => ({
    arvDrug: row.ARV_Drug || '',
    interactionCount: parseInt(row.Interaction_Count) || 0
  }));
}

// Load ARV interactions
export async function loadARVInteractions(): Promise<DrugInteraction[]> {
  const data = await loadCSV<Record<string, string>>('hiv_drug_interactions_arv_interactions.csv');
  return data.map((row, index) => ({
    id: `arv-${index}`,
    arvDrug: row.arv_drug || 'Unknown',
    otherDrug: row.interacting_drug_class || 'Unknown',
    mechanism: row.mechanism || '',
    clinicalComments: row.clinical_comments || '',
    severity: inferSeverity(row.clinical_comments) as DrugInteraction['severity'],
    tableNumber: row.table_number,
    page: row.page,
    confidence: 'Guideline-based'
  }));
}

// Load common medication interactions
export async function loadCommonMedInteractions(): Promise<DrugInteraction[]> {
  const data = await loadCSV<Record<string, string>>('hiv_drug_interactions_common_med_interactions.csv');
  return data.map((row, index) => ({
    id: `common-${index}`,
    arvDrug: row.arv_drugs || 'Unknown',
    otherDrug: row.table_name || 'Unknown',
    otherDrugClass: row.interaction_details,
    mechanism: '',
    clinicalComments: row.interaction_details || '',
    severity: inferSeverity(row.interaction_details) as DrugInteraction['severity'],
    tableNumber: row.table_number,
    page: row.page,
    confidence: 'Guideline-based'
  }));
}

// Load drug mechanisms
export async function loadDrugMechanisms(): Promise<Record<string, unknown[]>> {
  const data = await loadCSV<Record<string, string>>('hiv_drug_interactions_drug_mechanisms.csv');
  const mechanisms: Record<string, unknown[]> = {};
  
  data.forEach((row) => {
    if (row.drug_abbreviation) {
      if (!mechanisms[row.drug_abbreviation]) {
        mechanisms[row.drug_abbreviation] = [];
      }
      mechanisms[row.drug_abbreviation].push({
        page: row.page,
        context: row.context
      });
    }
  });
  
  return mechanisms;
}

// Load summary data
export async function loadSummaryData(): Promise<unknown> {
  return loadJSON<unknown>('hiv_drug_interactions_summary.json');
}

// Load complete interactions
export async function loadCompleteInteractions(): Promise<unknown> {
  return loadJSON<unknown>('hiv_drug_interactions_complete.json');
}

// Infer severity from clinical comments
function inferSeverity(comments: string): string {
  if (!comments) return 'Minor';
  const lower = comments.toLowerCase();
  
  if (lower.includes('contraindicated') || lower.includes('do not coadminister')) {
    return 'Contraindicated';
  }
  if (lower.includes('avoid') || lower.includes('caution') || lower.includes('monitor closely')) {
    return 'Warning';
  }
  if (lower.includes('monitor') || lower.includes('adjust dose') || lower.includes('reduce')) {
    return 'Monitor';
  }
  if (lower.includes('no significant') || lower.includes('no dose adjustment')) {
    return 'None';
  }
  return 'Minor';
}

// Get PK simulation rules based on mechanisms
export function getPKSimulationRules(): Record<string, Record<string, PKSimulation>> {
  return {
    'DTG': {
      'metformin': {
        arvDrug: 'DTG',
        concomitantDrug: 'metformin',
        predictedChange: '+1.5x',
        foldChange: 1.5,
        clinicalAction: 'Reduce metformin dose by 50% initially; monitor for adverse effects',
        mechanism: 'OCT2/MATE1 inhibition',
        confidence: 'Guideline-based'
      },
      'dofetilide': {
        arvDrug: 'DTG',
        concomitantDrug: 'dofetilide',
        predictedChange: 'CONTRAINDICATED',
        foldChange: 0,
        clinicalAction: 'Avoid concomitant use - may cause QT prolongation or torsades de pointes',
        mechanism: 'OCT2/MATE1 inhibition',
        confidence: 'Guideline-based'
      }
    },
    'ritonavir': {
      'simvastatin': {
        arvDrug: 'ritonavir',
        concomitantDrug: 'simvastatin',
        predictedChange: '+15x',
        foldChange: 15,
        clinicalAction: 'CONTRAINDICATED - potential for myopathy including rhabdomyolysis',
        mechanism: 'CYP3A4 inhibition',
        confidence: 'Guideline-based'
      },
      'lovastatin': {
        arvDrug: 'ritonavir',
        concomitantDrug: 'lovastatin',
        predictedChange: '+15x',
        foldChange: 15,
        clinicalAction: 'CONTRAINDICATED - potential for myopathy including rhabdomyolysis',
        mechanism: 'CYP3A4 inhibition',
        confidence: 'Guideline-based'
      }
    },
    'cobicistat': {
      'metformin': {
        arvDrug: 'cobicistat',
        concomitantDrug: 'metformin',
        predictedChange: '+1.5x',
        foldChange: 1.5,
        clinicalAction: 'Monitor for metformin-related adverse effects; reduce dose as needed',
        mechanism: 'MATE1 inhibition',
        confidence: 'Guideline-based'
      }
    },
    'BIC': {
      'metformin': {
        arvDrug: 'BIC',
        concomitantDrug: 'metformin',
        predictedChange: '+1.3x',
        foldChange: 1.3,
        clinicalAction: 'Administer at lowest dose possible; monitor for adverse effects',
        mechanism: 'MATE1/OCT2 inhibition',
        confidence: 'Guideline-based'
      }
    },
    'ATV': {
      'PPIs': {
        arvDrug: 'ATV',
        concomitantDrug: 'PPIs',
        predictedChange: '-50%',
        foldChange: 0.5,
        clinicalAction: 'Do not exceed omeprazole 20mg/day; administer ≥12 hours before boosted ATV',
        mechanism: 'Gastric pH increase reduces absorption',
        confidence: 'Guideline-based'
      }
    },
    'RPV': {
      'PPIs': {
        arvDrug: 'RPV',
        concomitantDrug: 'PPIs',
        predictedChange: 'CONTRAINDICATED',
        foldChange: 0,
        clinicalAction: 'Concurrent use of PPIs with oral RPV is contraindicated',
        mechanism: 'Gastric pH increase reduces absorption',
        confidence: 'Guideline-based'
      }
    }
  };
}

// Get CYP450 pathway data
export function getCYPPathways(): CYPPathway[] {
  return [
    {
      enzyme: 'CYP3A4',
      substrates: ['simvastatin', 'lovastatin', 'atorvastatin', 'midazolam', 'tacrolimus', 'cyclosporine'],
      inhibitors: ['ritonavir', 'cobicistat', 'atazanavir', 'darunavir', 'ketoconazole', 'clarithromycin'],
      inducers: ['rifampin', 'rifabutin', 'carbamazepine', 'phenytoin', 'efavirenz', 'etravirine'],
      interactions: [
        { drug: 'ritonavir', effect: 'inhibition', magnitude: 'strong' },
        { drug: 'cobicistat', effect: 'inhibition', magnitude: 'strong' },
        { drug: 'rifampin', effect: 'induction', magnitude: 'strong' },
        { drug: 'efavirenz', effect: 'induction', magnitude: 'moderate' }
      ]
    },
    {
      enzyme: 'CYP2D6',
      substrates: ['tramadol', 'codeine', 'metoprolol', 'paroxetine', 'fluoxetine'],
      inhibitors: ['ritonavir', 'fluoxetine', 'paroxetine', 'bupropion'],
      inducers: ['rifampin', 'carbamazepine'],
      interactions: [
        { drug: 'ritonavir', effect: 'inhibition', magnitude: 'moderate' }
      ]
    },
    {
      enzyme: 'CYP2C9',
      substrates: ['warfarin', 'phenytoin', 'tolbutamide', 'losartan'],
      inhibitors: ['ritonavir', 'fluconazole', 'amiodarone'],
      inducers: ['rifampin', 'carbamazepine', 'phenytoin'],
      interactions: [
        { drug: 'ritonavir', effect: 'inhibition', magnitude: 'moderate' },
        { drug: 'efavirenz', effect: 'induction', magnitude: 'moderate' }
      ]
    },
    {
      enzyme: 'OCT2/MATE1',
      substrates: ['metformin', 'dofetilide', 'atenolol'],
      inhibitors: ['dolutegravir', 'bictegravir', 'cobicistat', 'ritonavir'],
      inducers: [],
      interactions: [
        { drug: 'dolutegravir', effect: 'inhibition', magnitude: 'moderate' },
        { drug: 'bictegravir', effect: 'inhibition', magnitude: 'moderate' }
      ]
    },
    {
      enzyme: 'P-gp',
      substrates: ['digoxin', 'dabigatran', 'rivaroxaban', 'tenofovir'],
      inhibitors: ['ritonavir', 'cobicistat', 'atazanavir', 'darunavir'],
      inducers: ['rifampin', 'carbamazepine', 'phenytoin', 'etravirine'],
      interactions: [
        { drug: 'ritonavir', effect: 'inhibition', magnitude: 'strong' },
        { drug: 'etravirine', effect: 'induction', magnitude: 'moderate' }
      ]
    }
  ];
}

// Get timing rules for dosing optimization
export function getTimingRules(): Record<string, { separation: string; reason: string; severity: string }> {
  return {
    'DTG + cations': {
      separation: '2 hours before or 6 hours after',
      reason: 'Chelation with polyvalent cations',
      severity: 'Warning'
    },
    'BIC + antacids': {
      separation: '6 hours before or 2 hours after',
      reason: 'Chelation with aluminum/magnesium',
      severity: 'Warning'
    },
    'ATV + PPIs': {
      separation: '≥12 hours before boosted ATV',
      reason: 'Gastric pH increase reduces absorption',
      severity: 'Warning'
    },
    'RPV + PPIs': {
      separation: 'CONTRAINDICATED',
      reason: 'Gastric pH increase reduces absorption',
      severity: 'Contraindicated'
    },
    'RAL + antacids': {
      separation: 'Use alternative acid-reducing agent',
      reason: 'Chelation with aluminum-magnesium',
      severity: 'Contraindicated'
    }
  };
}

// Search interactions
export async function searchInteractions(query: string): Promise<DrugInteraction[]> {
  const [arvInteractions, commonInteractions] = await Promise.all([
    loadARVInteractions(),
    loadCommonMedInteractions()
  ]);
  
  const allInteractions = [...arvInteractions, ...commonInteractions];
  const lowerQuery = query.toLowerCase();
  
  return allInteractions.filter(interaction => 
    interaction.arvDrug.toLowerCase().includes(lowerQuery) ||
    interaction.otherDrug.toLowerCase().includes(lowerQuery) ||
    interaction.mechanism.toLowerCase().includes(lowerQuery) ||
    interaction.clinicalComments.toLowerCase().includes(lowerQuery)
  );
}

// Get drug list
export async function getDrugList(): Promise<string[]> {
  const summary = await loadSummaryData() as { unique_drugs?: string[] };
  return summary.unique_drugs || [];
}
