import { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Sample clinical trial data
const CLINICAL_TRIALS = [
  {
    id: 'NCT05132901',
    title: 'Long-Acting Cabotegravir + Rilpivirine for Treatment-Naive Adults',
    phase: 'Phase 3',
    status: 'recruiting',
    drugs: ['CAB', 'RPV'],
    eligibility: [
      'HIV-1 infected, treatment-naive adults',
      'CD4 count ≥200 cells/μL',
      'No prior ARV exposure',
      'Willing to receive injectable medication'
    ],
    exclusions: [
      'Previous INSTI resistance',
      'Active hepatitis B co-infection',
      'Significant renal impairment'
    ],
    locations: ['New York, NY', 'Los Angeles, CA', 'Miami, FL', 'Chicago, IL'],
    enrollment: 450,
    duration: '96 weeks',
    sponsor: 'ViiV Healthcare'
  },
  {
    id: 'NCT04994509',
    title: 'Lenacapavir for Multidrug-Resistant HIV-1',
    phase: 'Phase 2/3',
    status: 'recruiting',
    drugs: ['LEN'],
    eligibility: [
      'HIV-1 with resistance to ≥2 drug classes',
      'Virologic failure on current regimen',
      'No prior lenacapavir exposure'
    ],
    exclusions: [
      'Active opportunistic infection',
      'Prior lenacapavir treatment',
      'Pregnancy'
    ],
    locations: ['Boston, MA', 'San Francisco, CA', 'Seattle, WA'],
    enrollment: 120,
    duration: '52 weeks',
    sponsor: 'Gilead Sciences'
  },
  {
    id: 'NCT04811040',
    title: 'Bictegravir-Based Regimens in Older Adults (≥65 years)',
    phase: 'Phase 4',
    status: 'active',
    drugs: ['BIC', 'TAF', 'FTC'],
    eligibility: [
      'Age ≥65 years',
      'HIV-1 virologically suppressed',
      'On stable ARV regimen ≥6 months'
    ],
    exclusions: [
      'eGFR <30 mL/min',
      'Active malignancy',
      'Life expectancy <2 years'
    ],
    locations: ['Multiple US sites'],
    enrollment: 200,
    duration: '48 weeks',
    sponsor: 'NIH'
  },
  {
    id: 'NCT04729726',
    title: 'Dolutegravir Dosing in Pregnancy',
    phase: 'Phase 4',
    status: 'recruiting',
    drugs: ['DTG'],
    eligibility: [
      'HIV-1 infected pregnant women',
      'Gestational age 14-28 weeks',
      'Planning to continue DTG through delivery'
    ],
    exclusions: [
      'Multiple gestation',
      'Fetal anomalies',
      'Contraindications to DTG'
    ],
    locations: ['Durban, South Africa', 'Harare, Zimbabwe', 'Lusaka, Zambia'],
    enrollment: 300,
    duration: 'Through 6 months postpartum',
    sponsor: 'WHO'
  },
  {
    id: 'NCT04652729',
    title: 'Islatravir + Doravirine for Treatment-Naive Adults',
    phase: 'Phase 3',
    status: 'suspended',
    drugs: ['ISL', 'DOR'],
    eligibility: [
      'HIV-1 infected, treatment-naive',
      'CD4 ≥200 cells/μL',
      'No NNRTI or NRTI resistance'
    ],
    exclusions: [
      'HBV co-infection',
      'Prior islatravir exposure',
      'Significant cardiac disease'
    ],
    locations: ['On hold pending safety review'],
    enrollment: 0,
    duration: '96 weeks',
    sponsor: 'Merck'
  }
];

// Post-marketing surveillance data
const SURVEILLANCE_DATA = [
  {
    drug: 'Bictegravir/TAF/FTC (Biktarvy)',
    approvalDate: '2018-02-07',
    totalPatients: 285000,
    adverseEvents: 1240,
    seriousEvents: 89,
    commonReactions: ['Nausea (3.2%)', 'Headache (2.1%)', 'Diarrhea (1.8%)'],
    safetyAlerts: 0,
    labelUpdates: 2
  },
  {
    drug: 'Dolutegravir/Lamivudine (Dovato)',
    approvalDate: '2019-04-08',
    totalPatients: 95000,
    adverseEvents: 420,
    seriousEvents: 28,
    commonReactions: ['Headache (2.8%)', 'Insomnia (1.9%)', 'Fatigue (1.5%)'],
    safetyAlerts: 0,
    labelUpdates: 1
  },
  {
    drug: 'Cabotegravir/Rilpivirine (Cabenuva)',
    approvalDate: '2021-01-21',
    totalPatients: 45000,
    adverseEvents: 680,
    seriousEvents: 45,
    commonReactions: ['Injection site reactions (18%)', 'Pyrexia (3.2%)', 'Fatigue (2.8%)'],
    safetyAlerts: 1,
    labelUpdates: 3
  },
  {
    drug: 'Lenacapavir (Sunlenca)',
    approvalDate: '2022-12-22',
    totalPatients: 8500,
    adverseEvents: 180,
    seriousEvents: 12,
    commonReactions: ['Injection site reactions (22%)', 'Nausea (4.1%)', 'Fatigue (2.3%)'],
    safetyAlerts: 0,
    labelUpdates: 1
  }
];

export default function TrialMatching() {
  const [patientProfile, setPatientProfile] = useState({
    age: '',
    cd4: '',
    viralLoad: '',
    treatmentExperience: 'naive',
    pregnancy: false,
    renalFunction: 'normal'
  });
  
  const [matchedTrials, setMatchedTrials] = useState<typeof CLINICAL_TRIALS>([]);
  const [selectedTrial, setSelectedTrial] = useState<typeof CLINICAL_TRIALS[0] | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  const runMatching = () => {
    setIsMatching(true);
    
    // Simple matching algorithm
    const matches = CLINICAL_TRIALS.filter(trial => {
      // Filter by pregnancy
      if (patientProfile.pregnancy && !trial.title.toLowerCase().includes('pregnancy')) {
        return false;
      }
      
      // Filter by treatment experience
      if (patientProfile.treatmentExperience === 'naive' && 
          trial.eligibility.some(e => e.toLowerCase().includes('treatment-experienced'))) {
        return false;
      }
      
      return trial.status === 'recruiting' || trial.status === 'active';
    });
    
    setMatchedTrials(matches);
    setIsMatching(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recruiting':
        return <Badge className="bg-emerald-500">Recruiting</Badge>;
      case 'active':
        return <Badge className="bg-blue-500">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="matching" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="matching">Trial Matching</TabsTrigger>
          <TabsTrigger value="surveillance">Post-Marketing</TabsTrigger>
          <TabsTrigger value="investigational">Investigational</TabsTrigger>
        </TabsList>

        <TabsContent value="matching" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Patient Profile */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Patient Profile
                </CardTitle>
                <CardDescription>Enter patient characteristics for matching</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Age</Label>
                  <Input 
                    placeholder="Years"
                    value={patientProfile.age}
                    onChange={(e) => setPatientProfile({...patientProfile, age: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">CD4 Count (cells/μL)</Label>
                  <Input 
                    placeholder="e.g., 350"
                    value={patientProfile.cd4}
                    onChange={(e) => setPatientProfile({...patientProfile, cd4: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Viral Load (copies/mL)</Label>
                  <Input 
                    placeholder="e.g., 50000"
                    value={patientProfile.viralLoad}
                    onChange={(e) => setPatientProfile({...patientProfile, viralLoad: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Treatment Experience</Label>
                  <Select 
                    value={patientProfile.treatmentExperience}
                    onValueChange={(v) => setPatientProfile({...patientProfile, treatmentExperience: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="naive">Treatment-naive</SelectItem>
                      <SelectItem value="experienced">Treatment-experienced</SelectItem>
                      <SelectItem value="resistance">With resistance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Renal Function</Label>
                  <Select 
                    value={patientProfile.renalFunction}
                    onValueChange={(v) => setPatientProfile({...patientProfile, renalFunction: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (eGFR ≥90)</SelectItem>
                      <SelectItem value="mild">Mild impairment (60-89)</SelectItem>
                      <SelectItem value="moderate">Moderate impairment (30-59)</SelectItem>
                      <SelectItem value="severe">Severe impairment (&lt;30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="pregnancy"
                    checked={patientProfile.pregnancy}
                    onCheckedChange={(c) => setPatientProfile({...patientProfile, pregnancy: c as boolean})}
                  />
                  <Label htmlFor="pregnancy" className="text-sm">Pregnant</Label>
                </div>
                
                <Button 
                  onClick={runMatching}
                  disabled={isMatching}
                  className="w-full"
                >
                  {isMatching ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Find Matching Trials
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-violet-500" />
                    Matched Trials
                  </span>
                  {matchedTrials.length > 0 && (
                    <Badge>{matchedTrials.length} found</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchedTrials.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Enter patient profile and click &quot;Find Matching Trials&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchedTrials.map((trial) => (
                      <div 
                        key={trial.id}
                        className="p-4 border rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
                        onClick={() => setSelectedTrial(trial)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{trial.title}</p>
                              {getStatusBadge(trial.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{trial.id}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {trial.drugs.map(drug => (
                                <Badge key={drug} variant="outline" className="text-[10px]">
                                  {drug}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {trial.locations.length} locations
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {trial.enrollment} patients
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {trial.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surveillance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SURVEILLANCE_DATA.map((drug) => (
              <Card key={drug.drug}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{drug.drug}</CardTitle>
                  <CardDescription>Approved: {drug.approvalDate}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-lg font-bold">{drug.totalPatients.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Patients</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-lg font-bold">{drug.adverseEvents}</p>
                      <p className="text-[10px] text-muted-foreground">AE Reports</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium mb-1">Common Reactions:</p>
                    <ul className="text-[10px] text-muted-foreground space-y-0.5">
                      {drug.commonReactions.map((reaction, i) => (
                        <li key={i}>• {reaction}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    {drug.safetyAlerts > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {drug.safetyAlerts} Alert{drug.safetyAlerts > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      <FileText className="h-3 w-3 mr-1" />
                      {drug.labelUpdates} Label Update{drug.labelUpdates > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Post-marketing surveillance data is updated quarterly from FDA Adverse Event Reporting System (FAERS) 
              and WHO VigiBase. Last update: January 2025.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="investigational" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Investigational Drugs Pipeline</CardTitle>
              <CardDescription>Drugs in late-stage clinical development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    name: 'Islatravir (MK-8591)', 
                    company: 'Merck', 
                    phase: 'Phase 3', 
                    mechanism: 'NRTTI (nucleoside reverse transcriptase translocation inhibitor)',
                    status: 'On hold - safety review'
                  },
                  { 
                    name: 'GS-6207 (Lenacapavir oral)', 
                    company: 'Gilead', 
                    phase: 'Phase 2', 
                    mechanism: 'Capsid inhibitor - weekly oral',
                    status: 'Active'
                  },
                  { 
                    name: 'Fostemsavir combinations', 
                    company: 'ViiV', 
                    phase: 'Phase 3', 
                    mechanism: 'Attachment inhibitor + optimized background',
                    status: 'Recruiting'
                  },
                  { 
                    name: 'Ibalizumab IV', 
                    company: 'Theratechnologies', 
                    phase: 'Phase 3', 
                    mechanism: 'Anti-CD4 monoclonal antibody',
                    status: 'Active'
                  }
                ].map((drug, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="p-2 bg-violet-100 rounded">
                      <FlaskConical className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{drug.name}</p>
                        <Badge variant={drug.status === 'On hold - safety review' ? 'destructive' : 'default'} className="text-[10px]">
                          {drug.phase}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{drug.company}</p>
                      <p className="text-xs mt-1">{drug.mechanism}</p>
                      {drug.status !== 'Active' && drug.status !== 'Recruiting' && (
                        <p className="text-xs text-red-600 mt-1">{drug.status}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trial Detail Dialog */}
      <Dialog open={!!selectedTrial} onOpenChange={() => setSelectedTrial(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedTrial?.title}</DialogTitle>
            <DialogDescription>{selectedTrial?.id}</DialogDescription>
          </DialogHeader>
          
          {selectedTrial && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(selectedTrial.status)}
                <Badge variant="outline">{selectedTrial.phase}</Badge>
                <Badge variant="outline">{selectedTrial.sponsor}</Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Study Drugs</p>
                <div className="flex gap-2">
                  {selectedTrial.drugs.map(drug => (
                    <Badge key={drug} className="bg-blue-100 text-blue-800">{drug}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-muted-foreground text-xs">Enrollment</p>
                  <p className="font-medium">{selectedTrial.enrollment} patients</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-medium">{selectedTrial.duration}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-muted-foreground text-xs">Locations</p>
                  <p className="font-medium">{selectedTrial.locations.length} sites</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Key Eligibility Criteria</p>
                <ul className="text-sm space-y-1">
                  {selectedTrial.eligibility.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Key Exclusion Criteria</p>
                <ul className="text-sm space-y-1">
                  {selectedTrial.exclusions.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Study Locations</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTrial.locations.map((location, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on ClinicalTrials.gov
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Protocol
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
