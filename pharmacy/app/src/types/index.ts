// HIV Drug Interaction Platform Types

export interface ARVDrug {
  abbreviation: string;
  name: string;
  class: DrugClass;
  mechanisms: DrugMechanism;
}

export type DrugClass = 
  | 'INSTI' 
  | 'PI' 
  | 'NNRTI' 
  | 'NRTI' 
  | 'EI' 
  | 'Capsid Inhibitor'
  | 'PK Enhancer';

export interface DrugMechanism {
  cypSubstrate?: string;
  cypInhibitor?: string;
  cypInducer?: string;
  ugt1a1?: string;
  transporter?: string;
  other?: string;
}

export interface DrugInteraction {
  id: string;
  arvDrug: string;
  otherDrug: string;
  otherDrugClass?: string;
  mechanism: string;
  clinicalComments: string;
  severity: InteractionSeverity;
  tableNumber?: string;
  page?: string;
  confidence: ConfidenceLevel;
}

export type InteractionSeverity = 'Contraindicated' | 'Warning' | 'Monitor' | 'Minor' | 'None';
export type ConfidenceLevel = 'Guideline-based' | 'Observational' | 'Post-marketing' | 'Theoretical';

export interface PKSimulation {
  arvDrug: string;
  concomitantDrug: string;
  predictedChange: string;
  foldChange: number;
  clinicalAction: string;
  mechanism: string;
  confidence: ConfidenceLevel;
}

export interface DosingSchedule {
  drug: string;
  time: string;
  withFood: boolean;
  separationRequired?: string;
}

export interface RegimenConflict {
  drugs: string[];
  timingRule: string;
  severity: InteractionSeverity;
  suggestedSchedule: DosingSchedule[];
}

export interface MolecularStructure {
  name: string;
  formula: string;
  pdbId?: string;
  bindingTarget?: string;
  affinity?: number;
}

export interface ClinicalTrial {
  id: string;
  title: string;
  phase: string;
  eligibility: string[];
  drugs: string[];
  status: 'recruiting' | 'active' | 'completed' | 'suspended';
  location?: string;
}

export interface FormulationData {
  drug: string;
  formulation: string;
  adherenceRate: number;
  pillBurden: number;
  fdcFeasible: boolean;
  unmetNeeds: string[];
}

export interface EvidenceQuery {
  query: string;
  filters: Record<string, any>;
  results: any[];
  dataSource: string;
}

export interface RegulatoryReport {
  type: 'adverse_event' | 'interaction_summary' | 'rwe_package';
  title: string;
  content: string;
  generatedAt: Date;
  citations: string[];
}

// CYP450 Pathway data
export interface CYPPathway {
  enzyme: string;
  substrates: string[];
  inhibitors: string[];
  inducers: string[];
  interactions: PathwayInteraction[];
}

export interface PathwayInteraction {
  drug: string;
  effect: 'inhibition' | 'induction' | 'substrate';
  magnitude: 'strong' | 'moderate' | 'weak' | 'negligible';
}

// PK Curve data point
export interface PKDataPoint {
  time: number;
  concentration: number;
  drug: string;
  scenario: string;
}

// Drug counts from data
export interface DrugInteractionCount {
  arvDrug: string;
  interactionCount: number;
}
