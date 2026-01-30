import { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  Play, 
  RotateCcw, 
  Clock, 
  Utensils,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getPKSimulationRules, getCYPPathways } from '@/utils/dataLoader';
import type { PKSimulation, RegimenConflict } from '@/types';

// ARV drug PK parameters (from literature)
const ARV_PK_PARAMS: Record<string, {
  halfLife: number;
  timeToPeak: number;
  bioavailability: number;
  proteinBinding: number;
  metabolicPathway: string;
  foodEffect: string;
}> = {
  'DTG': {
    halfLife: 14,
    timeToPeak: 2,
    bioavailability: 0.83,
    proteinBinding: 0.99,
    metabolicPathway: 'UGT1A1, CYP3A4 (minor)',
    foodEffect: 'No significant effect'
  },
  'BIC': {
    halfLife: 17.3,
    timeToPeak: 2.5,
    bioavailability: 0.70,
    proteinBinding: 0.98,
    metabolicPathway: 'CYP3A4, UGT1A1',
    foodEffect: 'Take with food'
  },
  'RAL': {
    halfLife: 9,
    timeToPeak: 1,
    bioavailability: 0.60,
    proteinBinding: 0.83,
    metabolicPathway: 'UGT1A1',
    foodEffect: 'No significant effect'
  },
  'ATV': {
    halfLife: 7,
    timeToPeak: 2.5,
    bioavailability: 0.60,
    proteinBinding: 0.86,
    metabolicPathway: 'CYP3A4',
    foodEffect: 'Take with food'
  },
  'DRV': {
    halfLife: 15,
    timeToPeak: 2.5,
    bioavailability: 0.82,
    proteinBinding: 0.95,
    metabolicPathway: 'CYP3A4',
    foodEffect: 'Take with food'
  },
  'RPV': {
    halfLife: 50,
    timeToPeak: 4,
    bioavailability: 0.50,
    proteinBinding: 0.99,
    metabolicPathway: 'CYP3A4',
    foodEffect: 'Take with food (required)'
  },
  'EFV': {
    halfLife: 40,
    timeToPeak: 5,
    bioavailability: 0.50,
    proteinBinding: 0.99,
    metabolicPathway: 'CYP2B6, CYP3A4',
    foodEffect: 'Take on empty stomach'
  },
  'FTC': {
    halfLife: 10,
    timeToPeak: 1,
    bioavailability: 0.93,
    proteinBinding: 0.04,
    metabolicPathway: 'Not metabolized',
    foodEffect: 'No significant effect'
  },
  'TAF': {
    halfLife: 0.51,
    timeToPeak: 1,
    bioavailability: 0.25,
    proteinBinding: 0.80,
    metabolicPathway: 'Cathepsin A, CES1',
    foodEffect: 'Take with food'
  }
};

// Generate PK curve data
function generatePKCurve(
  drug: string, 
  dose: number, 
  interval: number, 
  duration: number,
  interactions: PKSimulation[] = [],
  withFood: boolean = false
): { time: number; concentration: number; scenario: string }[] {
  const params = ARV_PK_PARAMS[drug];
  if (!params) return [];
  
  const data: { time: number; concentration: number; scenario: string }[] = [];
  const ka = 1; // Absorption rate constant
  const ke = Math.LN2 / params.halfLife; // Elimination rate constant
  
  // Apply interaction effects
  let foldChange = 1;
  interactions.forEach(interaction => {
    if (interaction.arvDrug === drug) {
      foldChange *= interaction.foldChange;
    }
  });
  
  // Apply food effect
  const foodMultiplier = withFood && params.foodEffect.includes('with food') ? 1.2 : 1;
  
  const vd = 1; // Volume of distribution (simplified)
  const f = params.bioavailability * foodMultiplier; // Bioavailability
  
  for (let t = 0; t <= duration; t += 0.5) {
    let concentration = 0;
    
    // Multiple dose accumulation
    const numDoses = Math.floor(t / interval) + 1;
    for (let n = 0; n < numDoses; n++) {
      const doseTime = n * interval;
      if (t >= doseTime) {
        const timeSinceDose = t - doseTime;
        const doseConc = (f * dose / vd) * (ka / (ka - ke)) * 
          (Math.exp(-ke * timeSinceDose) - Math.exp(-ka * timeSinceDose));
        concentration += doseConc * foldChange;
      }
    }
    
    data.push({
      time: t,
      concentration: Math.max(0, concentration),
      scenario: 'baseline'
    });
  }
  
  return data;
}

export default function PKSimulator() {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(['DTG']);
  const [dose, setDose] = useState(50);
  const [interval, setInterval] = useState(24);
  const [duration, setDuration] = useState(72);
  const [withFood, setWithFood] = useState(false);
  const [simulationResults, setSimulationResults] = useState<PKSimulation[]>([]);
  const [pkData, setPkData] = useState<Record<string, number | string>[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const pkRules = useMemo(() => getPKSimulationRules(), []);
  const cypPathways = useMemo(() => getCYPPathways(), []);

  // Run PK simulation
  const runSimulation = () => {
    setIsSimulating(true);
    
    // Check for interactions
    const interactions: PKSimulation[] = [];
    selectedDrugs.forEach(arv => {
      ['metformin', 'simvastatin', 'PPIs'].forEach(drug => {
        const rule = pkRules[arv]?.[drug];
        if (rule) {
          interactions.push(rule);
        }
      });
    });
    
    setSimulationResults(interactions);
    
    // Generate PK curves
    const allData: Record<string, number | string>[] = [];
    selectedDrugs.forEach((drug, index) => {
      const drugInteractions = interactions.filter(i => i.arvDrug === drug);
      const curve = generatePKCurve(drug, dose, interval, duration, drugInteractions, withFood);
      
      curve.forEach(point => {
        const existing = allData.find(d => d.time === point.time);
        if (existing) {
          existing[`drug${index}`] = point.concentration;
          existing[`drug${index}_name`] = drug;
        } else {
          allData.push({
            time: point.time,
            [`drug${index}`]: point.concentration,
            [`drug${index}_name`]: drug
          });
        }
      });
    });
    
    setPkData(allData);
    setIsSimulating(false);
  };

  // Get dosing schedule conflicts
  const getConflicts = (): RegimenConflict[] => {
    const conflicts: RegimenConflict[] = [];
    
    // Check DTG + cations
    if (selectedDrugs.includes('DTG')) {
      conflicts.push({
        drugs: ['DTG', 'Polyvalent Cations'],
        timingRule: 'Separate by 2 hours before or 6 hours after DTG',
        severity: 'Warning',
        suggestedSchedule: [
          { drug: 'DTG', time: '08:00', withFood: true, separationRequired: undefined },
          { drug: 'Calcium supplement', time: '14:00', withFood: false, separationRequired: undefined },
          { drug: 'DTG', time: '20:00', withFood: true, separationRequired: undefined }
        ]
      });
    }
    
    return conflicts;
  };

  const conflicts = getConflicts();
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              PK Simulation Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">ARV Drug</Label>
                <Select 
                  value={selectedDrugs[0]} 
                  onValueChange={(v) => setSelectedDrugs([v])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ARV_PK_PARAMS).map(drug => (
                      <SelectItem key={drug} value={drug}>{drug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Dose (mg)</Label>
                <Input 
                  type="number" 
                  value={dose} 
                  onChange={(e) => setDose(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Interval (hours)</Label>
                <Select value={String(interval)} onValueChange={(v) => setInterval(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 hours (BID)</SelectItem>
                    <SelectItem value="24">24 hours (QD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Duration (hours)</Label>
                <Input 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  step={12}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="withFood"
                  checked={withFood}
                  onChange={(e) => setWithFood(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="withFood" className="text-sm flex items-center gap-1">
                  <Utensils className="h-3 w-3" />
                  With food
                </Label>
              </div>
              
              <Button 
                onClick={runSimulation}
                disabled={isSimulating}
                className="ml-auto"
              >
                {isSimulating ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Simulation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Drug Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDrugs.map(drug => {
              const params = ARV_PK_PARAMS[drug];
              if (!params) return null;
              return (
                <div key={drug} className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Half-life:</span>
                    <span className="font-medium">{params.halfLife}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tmax:</span>
                    <span className="font-medium">{params.timeToPeak}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bioavailability:</span>
                    <span className="font-medium">{(params.bioavailability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protein binding:</span>
                    <span className="font-medium">{(params.proteinBinding * 100).toFixed(0)}%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Metabolism:</span>
                    <p className="text-xs mt-1">{params.metabolicPathway}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Food:</span>
                    <p className="text-xs mt-1">{params.foodEffect}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="curves" className="space-y-4">
        <TabsList>
          <TabsTrigger value="curves">PK Curves</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="schedule">Dosing Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="curves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Concentration-Time Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {pkData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pkData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (hours)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Concentration (mg/L)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Legend />
                      {selectedDrugs.map((drug, index) => (
                        <Line 
                          key={drug}
                          type="monotone" 
                          dataKey={`drug${index}`}
                          name={drug}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-muted-foreground">Run simulation to view PK curves</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Predicted Drug Interactions</CardTitle>
              <CardDescription>Based on metabolic pathways and transporter effects</CardDescription>
            </CardHeader>
            <CardContent>
              {simulationResults.length > 0 ? (
                <div className="space-y-3">
                  {simulationResults.map((result, index) => (
                    <Alert 
                      key={index}
                      variant={result.predictedChange === 'CONTRAINDICATED' ? 'destructive' : 'default'}
                      className={result.predictedChange !== 'CONTRAINDICATED' ? 'border-amber-200 bg-amber-50' : ''}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <div className="text-sm">
                        <p className="font-medium">
                          {result.arvDrug} + {result.concomitantDrug}
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Mechanism:</strong> {result.mechanism}
                        </p>
                        <p className="text-xs">
                          <strong>Predicted change:</strong> {result.predictedChange}
                        </p>
                        <p className="text-xs">
                          <strong>Action:</strong> {result.clinicalAction}
                        </p>
                        <Badge variant="outline" className="mt-2 text-[10px]">{result.confidence}</Badge>
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No significant interactions predicted</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CYP Pathway Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metabolic Pathways</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cypPathways.slice(0, 4).map(pathway => (
                  <div key={pathway.enzyme} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">{pathway.enzyme}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        <span className="text-red-600 font-medium">Inhibitors:</span>{' '}
                        {pathway.inhibitors.slice(0, 3).join(', ')}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-emerald-600 font-medium">Inducers:</span>{' '}
                        {pathway.inducers.slice(0, 3).join(', ') || 'None'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Dosing Schedule Optimizer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conflicts.length > 0 ? (
                <div className="space-y-4">
                  {conflicts.map((conflict, index) => (
                    <Collapsible 
                      key={index}
                      open={scheduleOpen}
                      onOpenChange={setScheduleOpen}
                    >
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            <div>
                              <p className="font-medium text-sm">{conflict.drugs.join(' + ')}</p>
                              <p className="text-xs text-muted-foreground">{conflict.timingRule}</p>
                            </div>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {scheduleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        
                        <CollapsibleContent className="mt-4">
                          <p className="text-sm font-medium mb-2">Suggested Schedule:</p>
                          <div className="space-y-2">
                            {conflict.suggestedSchedule.map((slot, i) => (
                              <div 
                                key={i}
                                className="flex items-center gap-4 p-2 bg-slate-50 rounded"
                              >
                                <span className="font-mono text-sm">{slot.time}</span>
                                <span className="text-sm">{slot.drug}</span>
                                {slot.withFood && (
                                  <Badge variant="outline" className="text-[10px]">
                                    <Utensils className="h-3 w-3 mr-1" />
                                    With food
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No timing conflicts detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
