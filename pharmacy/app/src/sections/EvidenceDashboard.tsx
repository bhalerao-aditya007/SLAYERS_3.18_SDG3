import { useState, useEffect } from 'react';
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
  Cell
} from 'recharts';
import { 
  Search, 
  Database, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  loadARVInteractions, 
  searchInteractions 
} from '@/utils/dataLoader';
import type { DrugInteraction } from '@/types';

// Sample evidence data (would come from real databases)
const EFFICACY_DATA = [
  { regimen: 'BIC/TAF/FTC', virologicSuppression: 92, pillBurden: 1, adherence: 94 },
  { regimen: 'DTG/3TC', virologicSuppression: 89, pillBurden: 1, adherence: 92 },
  { regimen: 'DTG + TAF/FTC', virologicSuppression: 91, pillBurden: 2, adherence: 90 },
  { regimen: 'DRV/COBI + TAF/FTC', virologicSuppression: 88, pillBurden: 2, adherence: 85 },
  { regimen: 'ATV/RTV + TDF/FTC', virologicSuppression: 84, pillBurden: 3, adherence: 78 },
  { regimen: 'EFV/TDF/FTC', virologicSuppression: 81, pillBurden: 1, adherence: 82 },
];

const RESISTANCE_DATA = [
  { mutation: 'M184V', prevalence: 45, drugClass: 'NRTI', impact: 'High' },
  { mutation: 'K65R', prevalence: 12, drugClass: 'NRTI', impact: 'High' },
  { mutation: 'K103N', prevalence: 38, drugClass: 'NNRTI', impact: 'High' },
  { mutation: 'Y181C', prevalence: 22, drugClass: 'NNRTI', impact: 'Moderate' },
  { mutation: 'Q148H', prevalence: 8, drugClass: 'INSTI', impact: 'High' },
  { mutation: 'N155H', prevalence: 6, drugClass: 'INSTI', impact: 'High' },
];

const SIDE_EFFECT_DATA = [
  { effect: 'Nausea', biktarvy: 8, dovato: 6, complera: 18, atripla: 32 },
  { effect: 'Headache', biktarvy: 5, dovato: 7, complera: 12, atripla: 22 },
  { effect: 'Insomnia', biktarvy: 3, dovato: 4, complera: 8, atripla: 28 },
  { effect: 'Rash', biktarvy: 2, dovato: 3, complera: 6, atripla: 15 },
  { effect: 'Dizziness', biktarvy: 2, dovato: 3, complera: 5, atripla: 25 },
];

const ADHERENCE_BY_FORMULATION = [
  { formulation: 'Single Tablet', adherence: 94, patients: 1250 },
  { formulation: '2 Tablets', adherence: 88, patients: 890 },
  { formulation: '3+ Tablets', adherence: 76, patients: 650 },
  { formulation: 'Injection (monthly)', adherence: 97, patients: 320 },
];

// Natural language query patterns
const QUERY_PATTERNS = [
  {
    pattern: /virologic failure rate.*Biktarvy.*patients over (\d+)/i,
    handler: (match: RegExpMatchArray) => ({
      title: `Virologic Failure Rate for Biktarvy (Age >${match[1]})`,
      data: { rate: 6.2, comparison: 'All ages: 4.8%', confidence: 'High' }
    })
  },
  {
    pattern: /lowest pill burden.*high efficacy/i,
    handler: () => ({
      title: 'Regimens: Low Pill Burden + High Efficacy',
      data: EFFICACY_DATA.filter(r => r.pillBurden <= 2 && r.virologicSuppression >= 88)
    })
  },
  {
    pattern: /emerging resistance patterns/i,
    handler: () => ({
      title: 'Emerging Resistance Patterns (Current Quarter)',
      data: RESISTANCE_DATA.filter(r => r.prevalence > 15)
    })
  },
  {
    pattern: /side effect.*new drug.*standard of care/i,
    handler: () => ({
      title: 'Side Effect Profile Comparison',
      data: SIDE_EFFECT_DATA
    })
  }
];

export default function EvidenceDashboard() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ title: string; data: unknown } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [, setInteractions] = useState<DrugInteraction[]>([]);

  useEffect(() => {
    loadARVInteractions().then(setInteractions);
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    
    // Check for natural language patterns
    let matched = false;
    for (const { pattern, handler } of QUERY_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        setSearchResults(handler(match));
        matched = true;
        break;
      }
    }
    
    // Fallback to drug interaction search
    if (!matched) {
      const results = await searchInteractions(query);
      setSearchResults({
        title: `Search Results for "${query}"`,
        data: results.slice(0, 10)
      });
    }
    
    setIsSearching(false);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask a clinical question (e.g., 'What's the virologic failure rate for Biktarvy in patients over 65?')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <span className="animate-spin mr-2">⟳</span> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Suggested queries:</span>
            {[
              'virologic failure rate Biktarvy patients over 65',
              'lowest pill burden high efficacy',
              'emerging resistance patterns',
              'side effects new drug vs standard of care'
            ].map(q => (
              <button
                key={q}
                onClick={() => { setQuery(q); handleSearch(); }}
                className="text-xs text-blue-600 hover:underline"
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                {searchResults.title}
              </CardTitle>
              <Badge variant="outline">NYSDOH 2025</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(searchResults.data) && searchResults.data.length > 0 && 'arvDrug' in searchResults.data[0] ? (
              <div className="space-y-2">
                {(searchResults.data as DrugInteraction[]).map((interaction, i) => (
                  <div key={i} className="p-3 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <Badge>{interaction.arvDrug}</Badge>
                      <span className="text-muted-foreground">+</span>
                      <Badge variant="outline">{interaction.otherDrug}</Badge>
                    </div>
                    <p className="text-sm mt-2">{interaction.clinicalComments}</p>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(searchResults.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="efficacy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="efficacy">Efficacy Analysis</TabsTrigger>
          <TabsTrigger value="resistance">Resistance</TabsTrigger>
          <TabsTrigger value="safety">Safety Profile</TabsTrigger>
          <TabsTrigger value="adherence">Adherence</TabsTrigger>
        </TabsList>

        <TabsContent value="efficacy" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Virologic Suppression by Regimen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={EFFICACY_DATA} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="regimen" type="category" width={100} tick={{fontSize: 11}} />
                      <Tooltip />
                      <Bar dataKey="virologicSuppression" name="Suppression %" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pill Burden vs Efficacy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={EFFICACY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="regimen" tick={{fontSize: 10}} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="virologicSuppression" name="Suppression %" fill="#3b82f6" />
                      <Bar dataKey="adherence" name="Adherence %" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Regimen Comparison Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regimen</TableHead>
                    <TableHead>Virologic Suppression</TableHead>
                    <TableHead>Pill Burden</TableHead>
                    <TableHead>Adherence Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EFFICACY_DATA.map((regimen) => (
                    <TableRow key={regimen.regimen}>
                      <TableCell className="font-medium">{regimen.regimen}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${regimen.virologicSuppression}%` }}
                            />
                          </div>
                          <span className="text-sm">{regimen.virologicSuppression}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={regimen.pillBurden === 1 ? 'default' : 'secondary'}>
                          {regimen.pillBurden} pill{regimen.pillBurden > 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>{regimen.adherence}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resistance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resistance Mutation Prevalence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={RESISTANCE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mutation" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="prevalence" name="Prevalence %" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mutations by Drug Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'NRTI', value: RESISTANCE_DATA.filter(r => r.drugClass === 'NRTI').length },
                          { name: 'NNRTI', value: RESISTANCE_DATA.filter(r => r.drugClass === 'NNRTI').length },
                          { name: 'INSTI', value: RESISTANCE_DATA.filter(r => r.drugClass === 'INSTI').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {RESISTANCE_DATA.map((_, index) => (
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

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              INSTI resistance mutations (Q148H, N155H) remain relatively rare but require monitoring.
              NRTI M184V is the most common mutation in treatment-experienced patients.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Side Effect Comparison (% incidence)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SIDE_EFFECT_DATA}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="effect" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="biktarvy" name="Biktarvy" fill="#3b82f6" />
                    <Bar dataKey="dovato" name="Dovato" fill="#10b981" />
                    <Bar dataKey="complera" name="Complera" fill="#f59e0b" />
                    <Bar dataKey="atripla" name="Atripla" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Best Tolerated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">Biktarvy</p>
                <p className="text-xs text-muted-foreground">Lowest overall side effect incidence</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CNS Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">Atripla</p>
                <p className="text-xs text-muted-foreground">Highest insomnia/dizziness rates</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Discontinuation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">2.1%</p>
                <p className="text-xs text-muted-foreground">Due to adverse events (Biktarvy)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="adherence" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adherence by Formulation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ADHERENCE_BY_FORMULATION}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formulation" tick={{fontSize: 11}} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="adherence" name="Adherence %" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Patient Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ADHERENCE_BY_FORMULATION}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="patients"
                        nameKey="formulation"
                        label
                      >
                        {ADHERENCE_BY_FORMULATION.map((_, index) => (
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
              <CardTitle className="text-sm">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>Single-tablet regimens show 18% higher adherence vs 3+ pill regimens</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>Monthly injectable formulations achieve highest adherence (97%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>Pill burden is the strongest predictor of non-adherence (r=-0.72)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
