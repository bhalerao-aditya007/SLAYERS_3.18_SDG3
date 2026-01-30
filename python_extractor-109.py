import pdfplumber
import pandas
import json
import re
import os

OUTPUT_CSV = 'hiv_drug_interactions_data.csv'
OUTPUT_JSON = 'hiv_drug_interactions_data.json'

def clean_table_data(table):
  if not table:
    return None
  if len(table)<2:
    return None
    
  df = pd.DataFrame(table[1:], columns=table[0])
