import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  Pill, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FlaskConical,
  Clock,
  Baby,
  Syringe,
  Tablet,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// FDC feasibility data
const FDC_COMBINATIONS = [
  {
    name: 'BIC/TAF/FTC',
    components: ['Bictegravir', 'Tenofovir AF', 'Emtricitabine'],
    existing: true,
    brandName: 'Biktarvy',
    feasibility: 'Available',
    barriers: [],
    advantages: ['Single tablet', 'High barrier to resistance', 'Well tolerated'],
    pillBurden: 1,
    dosingFrequency: 'Once daily'
  },
  {
    name: 'DTG/3TC',
    components: ['Dolutegravir', 'Lamivudine'],
    existing: true,
    brandName: 'Dovato',
    feasibility: 'Available',
    barriers: [],
    advantages: ['2-drug regimen', 'Reduced NRTI exposure', 'Compact size'],
    pillBurden: 1,
    dosingFrequency: 'Once daily'
  },
  {
    name: 'CAB/RPV',
    components: ['Cabotegravir', 'Rilpivirine'],
    existing: true,
    brandName: 'Cabenuva',
    feasibility: 'Available (Injectable)',
    barriers: ['Injection site reactions', 'Cold chain storage'],
    advantages: ['Monthly dosing', 'No daily pills', 'High adherence'],
    pillBurden: 0,
    dosingFrequency: 'Monthly injection'
  },
  {
    name: 'DTG/TAF/FTC',
    components: ['Dolutegravir', 'Tenofovir AF', 'Emtricitabine'],
    existing: false,
    brandName: null,
    feasibility: 'Theoretically feasible',
    barriers: ['Patent considerations', 'Similar to existing products'],
    advantages: ['INSTI-based', 'Proven components'],
    pillBurden: 1,
    dosingFrequency: 'Once daily'
  },
  {
    name: 'DOR/TAF/FTC',
    components: ['Doravirine', 'Tenofovir AF', 'Emtricitabine'],
    existing: false,
    brandName: null,
    feasibility: 'Under investigation',
    barriers: ['Limited data', 'NNRTI resistance concerns'],
    advantages: ['Lipid-neutral', 'CNS well-tolerated'],
    pillBurden: 1,
    dosingFrequency: 'Once daily'
  }
];

// Adherence data by formulation
const ADHERENCE_DATA = [
  { formulation: 'Single Tablet Daily', adherence: 94, persistence: 88, satisfaction: 92 },
  { formulation: '2 Tablets Daily', adherence: 88, persistence: 81, satisfaction: 85 },
  { formulation: '3+ Tablets Daily', adherence: 76, persistence: 68, satisfaction: 72 },
  { formulation: 'Monthly Injection', adherence: 97, persistence: 94, satisfaction: 89 },
  { formulation: 'Weekly Oral', adherence: 91, persistence: 85, satisfaction: 87 },
];

// Unmet needs analysis
const UNMET_NEEDS = [
  {
    category: 'Pediatric',
    need: 'Child-friendly formulations',
    priority: 'High',
    description: 'Dispersible tablets, liquid formulations for children <25kg',
    gaps: ['Limited INSTI options', 'Taste masking challenges', 'Dosing accuracy']
  },
  {
    category: 'Pregnancy',
    need: 'Pregnancy-optimized dosing',
    priority: 'High',
    description: 'Therapeutic drug monitoring, adjusted dosing in 2nd/3rd trimester',
    gaps: ['PK changes in pregnancy', 'Limited safety data', 'Fetal exposure concerns']
  },
  {
    category: 'Renal Impairment',
    need: 'Renally-adjusted formulations',
    priority: 'Medium',
    description: 'TAF-based options, dose adjustments for eGFR <30',
    gaps: ['Limited data in severe impairment', 'TDF contraindicated']
  },
  {
    category: 'Long-acting',
    need: 'Extended-release options',
    priority: 'Medium',
    description: '6-monthly injections, implantable devices',
    gaps: ['CAB/RPV only option', 'Injection site reactions', 'Cost']
  },
  {
    category: 'Resistance',
    need: 'Ultra-high barrier regimens',
    priority: 'High',
    description: 'Options for MDR HIV, salvage therapy',
    gaps: ['Limited active agents', 'Complex regimens', 'Toxicity']
  }
];

// Formulation radar data
const FORMULATION_PROFILES = [
  {
    type: 'Single Tablet',
    convenience: 95,
    efficacy: 92,
    safety: 90,
    adherence: 94,
    cost: 70,
    flexibility: 60
  },
  {
    type: 'Multi-Tablet',
    convenience: 60,
    efficacy: 90,
    safety: 85,
    adherence: 76,
    cost: 85,
    flexibility: 80
  },
  {
    type: 'Injectable',
    convenience: 85,
    efficacy: 93,
    safety: 82,
    adherence: 97,
    cost: 55,
    flexibility: 45
  }
];

export default function FormulationOptimizer() {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [fdcResult, setFdcResult] = useState<typeof FDC_COMBINATIONS[0] | null>(null);

  const checkFDC = () => {
    // Simple FDC checking logic
    const match = FDC_COMBINATIONS.find(fdc => 
      selectedDrugs.every(drug => 
        fdc.components.some(comp => 
          comp.toLowerCase().includes(drug.toLowerCase())
        )
      )
    );
    setFdcResult(match || null);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="fdc" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="fdc">FDC Checker</TabsTrigger>
          <TabsTrigger value="adherence">Adherence Analysis</TabsTrigger>
          <TabsTrigger value="unmet">Unmet Needs</TabsTrigger>
          <TabsTrigger value="profiles">Formulation Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="fdc" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* FDC Checker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-blue-500" />
                  FDC Feasibility Checker
                </CardTitle>
                <CardDescription>
                  Check if drug combinations are available as fixed-dose combinations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs mb-2 block">Select ARV Components</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Bictegravir', 'Dolutegravir', 'Cabotegravir', 'TAF', 'TDF', '3TC', 'FTC', 'RPV'].map(drug => (
                      <div key={drug} className="flex items-center gap-2">
                        <Checkbox 
                          id={drug}
                          checked={selectedDrugs.includes(drug)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDrugs([...selectedDrugs, drug]);
                            } else {
                              setSelectedDrugs(selectedDrugs.filter(d => d !== drug));
                            }
                          }}
                        />
                        <Label htmlFor={drug} className="text-sm">{drug}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={checkFDC}
                  disabled={selectedDrugs.length < 2}
                  className="w-full"
                >
                  Check FDC Availability
                </Button>

                {fdcResult && (
                  <Alert className={fdcResult.existing ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}>
                    <div className="flex items-start gap-2">
                      {fdcResult.existing ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )}
                      <div>
                        <AlertDescription className={fdcResult.existing ? 'text-emerald-800' : 'text-amber-800'}>
                          <p className="font-medium">{fdcResult.name}</p>
                          {fdcResult.existing ? (
                            <>
                              <p className="text-sm">Available as: <strong>{fdcResult.brandName}</strong></p>
                              <p className="text-sm">{fdcResult.dosingFrequency} • {fdcResult.pillBurden} pill{fdcResult.pillBurden !== 1 ? 's' : ''}</p>
                            </>
                          ) : (
                            <p className="text-sm">{fdcResult.feasibility}</p>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                {selectedDrugs.length >= 2 && !fdcResult && (
                  <Alert variant="destructive">
                    <XCircle className="h-5 w-5" />
                    <AlertDescription>
                      No FDC available for this combination. Consider individual components.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Available FDCs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available FDC Regimens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {FDC_COMBINATIONS.filter(fdc => fdc.existing).map((fdc) => (
                    <div key={fdc.name} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{fdc.brandName}</p>
                          <p className="text-xs text-muted-foreground">{fdc.name}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {fdc.dosingFrequency}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {fdc.advantages.map((adv, i) => (
                          <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {adv}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="adherence" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adherence by Formulation Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ADHERENCE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formulation" tick={{fontSize: 10}} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="adherence" name="Adherence %" fill="#3b82f6" />
                      <Bar dataKey="persistence" name="Persistence %" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Patient Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ADHERENCE_DATA}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="satisfaction"
                        nameKey="formulation"
                        label
                      >
                        {ADHERENCE_DATA.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Key Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Syringe className="h-5 w-5 text-emerald-600" />
                    <p className="font-medium text-sm">Monthly Injection</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">97%</p>
                  <p className="text-xs text-emerald-600">Highest adherence rate</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Tablet className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-sm">Single Tablet</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">94%</p>
                  <p className="text-xs text-blue-600">Standard of care adherence</p>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-5 w-5 text-amber-600" />
                    <p className="font-medium text-sm">3+ Tablets</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">76%</p>
                  <p className="text-xs text-amber-600">Significant adherence gap</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unmet" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UNMET_NEEDS.map((need, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {need.category === 'Pediatric' && <Baby className="h-4 w-4 text-pink-500" />}
                      {need.category === 'Pregnancy' && <span className="text-rose-500">♀</span>}
                      {need.category === 'Renal Impairment' && <span className="text-blue-500">⚕</span>}
                      {need.category === 'Long-acting' && <Clock className="h-4 w-4 text-violet-500" />}
                      {need.category === 'Resistance' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {need.category}
                    </CardTitle>
                    <Badge 
                      variant={need.priority === 'High' ? 'destructive' : 'default'}
                      className="text-[10px]"
                    >
                      {need.priority} Priority
                    </Badge>
                  </div>
                  <CardDescription>{need.need}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{need.description}</p>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Key Gaps:</p>
                    <ul className="text-xs space-y-0.5">
                      {need.gaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <ChevronRight className="h-3 w-3 text-slate-400 mt-0.5" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Formulation Comparison Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={FORMULATION_PROFILES}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="type" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Single Tablet"
                        dataKey="convenience"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Metric</TableHead>
                      <TableHead className="text-xs">Single Tablet</TableHead>
                      <TableHead className="text-xs">Multi-Tablet</TableHead>
                      <TableHead className="text-xs">Injectable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { metric: 'Convenience', single: 95, multi: 60, inject: 85 },
                      { metric: 'Efficacy', single: 92, multi: 90, inject: 93 },
                      { metric: 'Safety', single: 90, multi: 85, inject: 82 },
                      { metric: 'Adherence', single: 94, multi: 76, inject: 97 },
                      { metric: 'Cost-effectiveness', single: 70, multi: 85, inject: 55 },
                      { metric: 'Dosing Flexibility', single: 60, multi: 80, inject: 45 },
                    ].map((row) => (
                      <TableRow key={row.metric}>
                        <TableCell className="text-xs font-medium">{row.metric}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${row.single}%` }} />
                            </div>
                            {row.single}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${row.multi}%` }} />
                            </div>
                            {row.multi}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500" style={{ width: `${row.inject}%` }} />
                            </div>
                            {row.inject}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
