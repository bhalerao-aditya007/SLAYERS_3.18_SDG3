import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  User,
  Pill,
  Activity,
  ExternalLink,
  Copy,
  Printer,
  Shield,
  Database,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Report templates
const REPORT_TEMPLATES = {
  adverseEvent: {
    name: 'Adverse Event Report',
    sections: ['Patient Information', 'Suspect Drug', 'Event Description', 'Outcome', 'Reporter'],
    regulatory: 'FDA MedWatch Form 3500A'
  },
  interactionSummary: {
    name: 'Drug Interaction Case Summary',
    sections: ['Case Overview', 'Interaction Mechanism', 'Clinical Course', 'Management', 'References'],
    regulatory: 'FDA Drug Interaction Study Report'
  },
  rwePackage: {
    name: 'Real-World Evidence Package',
    sections: ['Study Design', 'Data Sources', 'Analysis Methods', 'Results', 'Conclusions'],
    regulatory: 'FDA RWE Guidance Compliance'
  }
};

// Sample adverse event data
const SAMPLE_AE_CASES = [
  {
    id: 'AE-2025-001',
    patientId: 'P-12345',
    drug: 'Bictegravir/TAF/FTC',
    event: 'Severe nausea, vomiting',
    onset: '2025-01-15',
    severity: 'Moderate',
    outcome: 'Recovered with dose adjustment',
    reporter: 'Dr. Smith',
    status: 'submitted'
  },
  {
    id: 'AE-2025-002',
    patientId: 'P-12346',
    drug: 'Dolutegravir',
    event: 'Insomnia, anxiety',
    onset: '2025-01-18',
    severity: 'Mild',
    outcome: 'Ongoing monitoring',
    reporter: 'Dr. Johnson',
    status: 'pending'
  },
  {
    id: 'AE-2025-003',
    patientId: 'P-12347',
    drug: 'Cabotegravir/Rilpivirine',
    event: 'Injection site reaction',
    onset: '2025-01-20',
    severity: 'Severe',
    outcome: 'Hospitalization required',
    reporter: 'Dr. Williams',
    status: 'under_review'
  }
];

// Sample interaction cases
const SAMPLE_INTERACTION_CASES = [
  {
    id: 'DI-2025-001',
    drugs: ['Dolutegravir', 'Metformin'],
    mechanism: 'OCT2/MATE1 inhibition',
    effect: 'Increased metformin exposure (1.5x)',
    clinicalImpact: 'Patient experienced lactic acidosis symptoms',
    management: 'Reduced metformin dose by 50%',
    outcome: 'Symptoms resolved',
    references: ['NYSDOH AI 2025 p.32', 'DTG Product Label']
  },
  {
    id: 'DI-2025-002',
    drugs: ['Ritonavir-boosted Atazanavir', 'Simvastatin'],
    mechanism: 'CYP3A4 inhibition',
    effect: 'CONTRAINDICATED - 15x increase in statin exposure',
    clinicalImpact: 'Patient developed rhabdomyolysis',
    management: 'Discontinued simvastatin, switched to pravastatin',
    outcome: 'Recovered with supportive care',
    references: ['NYSDOH AI 2025 p.45', 'FDA Warning 2012']
  }
];

export default function RegulatoryTools() {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof REPORT_TEMPLATES>('adverseEvent');
  const [reportData, setReportData] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');

  const generateReport = () => {
    const template = REPORT_TEMPLATES[selectedTemplate];
    let report = `=== ${template.name} ===\n\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Regulatory Standard: ${template.regulatory}\n\n`;
    
    template.sections.forEach(section => {
      report += `--- ${section} ---\n`;
      report += `${reportData[section] || '[No data provided]'}\n\n`;
    });
    
    setGeneratedReport(report);
    setPreviewOpen(true);
  };

  const downloadReport = () => {
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate}-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="generator">Report Generator</TabsTrigger>
          <TabsTrigger value="ae">Adverse Events</TabsTrigger>
          <TabsTrigger value="interactions">Interaction Cases</TabsTrigger>
          <TabsTrigger value="rwe">RWE Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Template Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Report Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Select Report Type</Label>
                  <Select 
                    value={selectedTemplate} 
                    onValueChange={(v) => setSelectedTemplate(v as keyof typeof REPORT_TEMPLATES)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                        <SelectItem key={key} value={key}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Sections:</p>
                  <ul className="text-xs space-y-1">
                    {REPORT_TEMPLATES[selectedTemplate].sections.map((section, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {section}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Compliant with: {REPORT_TEMPLATES[selectedTemplate].regulatory}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Entry */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Report Data Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {REPORT_TEMPLATES[selectedTemplate].sections.map((section) => (
                  <div key={section} className="space-y-2">
                    <Label className="text-xs">{section}</Label>
                    <Textarea
                      placeholder={`Enter ${section.toLowerCase()}...`}
                      value={reportData[section] || ''}
                      onChange={(e) => setReportData({...reportData, [section]: e.target.value})}
                      rows={3}
                    />
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button onClick={generateReport} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Preview Report
                  </Button>
                  <Button variant="outline" onClick={() => setReportData({})}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ae" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Adverse Event Cases
                </CardTitle>
                <CardDescription>Track and manage adverse event reports</CardDescription>
              </div>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Case ID</TableHead>
                    <TableHead className="text-xs">Drug</TableHead>
                    <TableHead className="text-xs">Event</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SAMPLE_AE_CASES.map((ae) => (
                    <TableRow key={ae.id}>
                      <TableCell className="text-xs font-medium">{ae.id}</TableCell>
                      <TableCell className="text-xs">{ae.drug}</TableCell>
                      <TableCell className="text-xs">{ae.event}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={ae.severity === 'Severe' ? 'destructive' : ae.severity === 'Moderate' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {ae.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {ae.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Submission Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Submitted to FDA</span>
                    <Badge variant="outline">12</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Review</span>
                    <Badge variant="outline" className="bg-amber-100">5</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Under Investigation</span>
                    <Badge variant="outline" className="bg-blue-100">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Regulatory Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span>Serious AE: 15 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    <span>Non-serious: Quarterly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>PSUR: Annual</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  FDA MedWatch Portal
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  FAERS Database
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  CIOMS Form
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-500" />
                Drug Interaction Case Studies
              </CardTitle>
              <CardDescription>Documented interaction cases for regulatory submission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SAMPLE_INTERACTION_CASES.map((interaction) => (
                  <div key={interaction.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{interaction.id}</p>
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Significant
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-violet-100 text-violet-800 text-[10px]">
                            {interaction.drugs[0]}
                          </Badge>
                          <span className="text-muted-foreground">+</span>
                          <Badge className="bg-violet-100 text-violet-800 text-[10px]">
                            {interaction.drugs[1]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Mechanism</p>
                        <p>{interaction.mechanism}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Effect</p>
                        <p>{interaction.effect}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clinical Impact</p>
                        <p>{interaction.clinicalImpact}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Management</p>
                        <p>{interaction.management}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">References:</p>
                      <div className="flex flex-wrap gap-1">
                        {interaction.references.map((ref, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              All interaction cases are documented according to FDA Drug Interaction Guidance 
              and include mechanistic rationale, clinical course, and management strategies.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="rwe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-500" />
                Real-World Evidence Packages
              </CardTitle>
              <CardDescription>Generate regulatory-ready RWE documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <p className="font-medium text-sm">New Indication Submission</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    RWE package for supplemental indication based on real-world effectiveness data
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Study protocol
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Data quality documentation
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Statistical analysis plan
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Generate Package
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-violet-500" />
                    <p className="font-medium text-sm">Safety Surveillance Report</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Post-marketing safety analysis using claims and EHR data
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Cohort definitions
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Outcome validation
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Sensitivity analyses
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Generate Package
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-5 w-5 text-amber-500" />
                    <p className="font-medium text-sm">Comparative Effectiveness</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Head-to-head comparison of ARV regimens using real-world data
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Propensity score methods
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Confounding control
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Effect estimates
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Generate Package
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-rose-500" />
                    <p className="font-medium text-sm">Special Population Analysis</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Effectiveness and safety in pediatric, pregnant, or elderly populations
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Population definitions
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Subgroup analyses
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Generalizability assessment
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Generate Package
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-800">FDA RWE Guidance Compliant</AlertTitle>
            <AlertDescription className="text-emerald-700">
              All RWE packages are structured according to FDA&apos;s Real-World Evidence Framework 
              (December 2021) and include required elements for regulatory submission.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>{REPORT_TEMPLATES[selectedTemplate].name}</DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
            {generatedReport}
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadReport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
