import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Upload, 
  Play, 
  RotateCcw, 
  CheckCircle2,
  Microscope,
  FileCode2,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// HIV Protein targets
const HIV_PROTEINS = {
  protease: {
    name: 'HIV-1 Protease',
    pdbId: '1HSG',
    description: 'Aspartic protease essential for viral maturation',
    residues: 99,
    activeSite: 'Asp25, Thr26, Gly27',
    color: '#ef4444'
  },
  integrase: {
    name: 'HIV-1 Integrase',
    pdbId: '1BIS',
    description: 'Catalyzes viral DNA integration into host genome',
    residues: 288,
    activeSite: 'Asp64, Asp116, Glu152',
    color: '#3b82f6'
  },
  reverseTranscriptase: {
    name: 'Reverse Transcriptase',
    pdbId: '1RTD',
    description: 'RNA-dependent DNA polymerase',
    residues: 560,
    activeSite: 'Asp110, Asp185, Asp186',
    color: '#10b981'
  }
};

// Sample drug molecules
const SAMPLE_DRUGS = [
  { name: 'Darunavir', target: 'protease', affinity: 0.03, type: 'PI' },
  { name: 'Raltegravir', target: 'integrase', affinity: 0.18, type: 'INSTI' },
  { name: 'Efavirenz', target: 'reverseTranscriptase', affinity: 0.12, type: 'NNRTI' },
  { name: 'Dolutegravir', target: 'integrase', affinity: 0.02, type: 'INSTI' },
  { name: 'Atazanavir', target: 'protease', affinity: 0.05, type: 'PI' }
];

// 3D Protein Structure Component
function ProteinStructure({ 
  protein, 
  selectedDrug, 
  showBinding 
}: { 
  protein: keyof typeof HIV_PROTEINS;
  selectedDrug: typeof SAMPLE_DRUGS[0] | null;
  showBinding: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const proteinData = HIV_PROTEINS[protein];
  
  // Generate pseudo-random structure based on protein type
  const residues = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const count = protein === 'protease' ? 30 : protein === 'integrase' ? 45 : 60;
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 4;
      const radius = 2 + Math.sin(t * Math.PI * 3) * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.sin(t * Math.PI * 2) * 1.5;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, [protein]);

  const connections = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < residues.length - 1; i++) {
      lines.push([residues[i], residues[i + 1]]);
    }
    return lines;
  }, [residues]);

  return (
    <group ref={meshRef}>
      {/* Protein backbone */}
      {residues.map((pos, i) => (
        <mesh 
          key={i} 
          position={pos}
          onPointerOver={() => setHovered(i)}
          onPointerOut={() => setHovered(null)}
        >
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color={hovered === i ? '#fbbf24' : proteinData.color} 
            roughness={0.3}
            metalness={0.2}
          />
          {hovered === i && (
            <Html distanceFactor={10}>
              <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Residue {i + 1}
              </div>
            </Html>
          )}
        </mesh>
      ))}
      
      {/* Connections */}
      {connections.map((line, i) => (
        <Line 
          key={i} 
          points={line} 
          color="#64748b" 
          lineWidth={2} 
        />
      ))}
      
      {/* Active site marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          transparent 
          opacity={0.6}
          emissive="#fbbf24"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Drug molecule binding */}
      {showBinding && selectedDrug && selectedDrug.target === protein && (
        <group>
          <mesh position={[0.5, 0.3, 0.2]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial 
              color="#a855f7" 
              emissive="#a855f7"
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Binding affinity indicator */}
          <Html position={[1, 1, 0]} distanceFactor={8}>
            <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-lg">
              Ki: {selectedDrug.affinity} nM
            </div>
          </Html>
        </group>
      )}
      
      {/* Label */}
      <Html position={[0, -3.5, 0]} center distanceFactor={10}>
        <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg text-center">
          <p className="font-semibold text-sm">{proteinData.name}</p>
          <p className="text-xs text-muted-foreground">PDB: {proteinData.pdbId}</p>
        </div>
      </Html>
    </group>
  );
}

// CYP450 Pathway Visualization
function CYPPathwayVisualizer() {
  const enzymes = [
    { name: 'CYP3A4', x: 0, y: 2, inhibitors: ['RTV', 'COBI', 'ATV'], inducers: ['EFV', 'ETR'] },
    { name: 'CYP2D6', x: -3, y: 0, inhibitors: ['RTV'], inducers: [] },
    { name: 'CYP2C9', x: 3, y: 0, inhibitors: ['RTV'], inducers: ['EFV'] },
    { name: 'OCT2', x: 0, y: -2, inhibitors: ['DTG', 'BIC'], inducers: [] },
  ];

  return (
    <div className="relative h-96 bg-slate-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls enableZoom={true} enablePan={true} />
        
        {enzymes.map((enzyme) => (
          <group key={enzyme.name} position={[enzyme.x, enzyme.y, 0]}>
            {/* Enzyme sphere */}
            <mesh>
              <sphereGeometry args={[0.6, 32, 32]} />
              <meshStandardMaterial 
                color="#3b82f6" 
                emissive="#1d4ed8"
                emissiveIntensity={0.2}
              />
            </mesh>
            
            {/* Label */}
            <Html center distanceFactor={8}>
              <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                {enzyme.name}
              </div>
            </Html>
            
            {/* Inhibitors */}
            {enzyme.inhibitors.map((inh, i) => (
              <group key={inh} position={[Math.cos(i * 1.5) * 1.5, Math.sin(i * 1.5) * 1.5, 0]}>
                <mesh>
                  <sphereGeometry args={[0.25, 16, 16]} />
                  <meshStandardMaterial color="#ef4444" />
                </mesh>
                <Html center distanceFactor={10}>
                  <div className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {inh}
                  </div>
                </Html>
                <Line 
                  points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(-Math.cos(i * 1.5) * 1.5, -Math.sin(i * 1.5) * 1.5, 0)]}
                  color="#ef4444"
                  lineWidth={2}
                />
              </group>
            ))}
            
            {/* Inducers */}
            {enzyme.inducers.map((ind, i) => (
              <group key={ind} position={[Math.cos(i * 1.5 + Math.PI) * 1.5, Math.sin(i * 1.5 + Math.PI) * 1.5, 0]}>
                <mesh>
                  <sphereGeometry args={[0.25, 16, 16]} />
                  <meshStandardMaterial color="#10b981" />
                </mesh>
                <Html center distanceFactor={10}>
                  <div className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {ind}
                  </div>
                </Html>
                <Line 
                  points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(-Math.cos(i * 1.5 + Math.PI) * 1.5, -Math.sin(i * 1.5 + Math.PI) * 1.5, 0)]}
                  color="#10b981"
                  lineWidth={2}
                />
              </group>
            ))}
          </group>
        ))}
      </Canvas>
      
      <div className="absolute bottom-2 left-2 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-white">Inhibitor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-white">Inducer</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-white">Enzyme</span>
        </div>
      </div>
    </div>
  );
}

export default function MolecularLab() {
  const [selectedProtein, setSelectedProtein] = useState<keyof typeof HIV_PROTEINS>('protease');
  const [selectedDrug, setSelectedDrug] = useState<typeof SAMPLE_DRUGS[0] | null>(null);
  const [showBinding, setShowBinding] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSimulationRunning(true);
      setTimeout(() => setSimulationRunning(false), 2000);
    }
  };

  const runSimulation = () => {
    setSimulationRunning(true);
    setShowBinding(true);
    setTimeout(() => setSimulationRunning(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Microscope className="h-4 w-4 text-blue-500" />
              HIV Proteins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Protease, Integrase, RT</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-emerald-500" />
              Structure Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">SDF, PDB</p>
            <p className="text-xs text-muted-foreground">Upload molecular files</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-500" />
              Binding Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">ML-Based</p>
            <p className="text-xs text-muted-foreground">Interaction scoring</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visualization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="visualization">3D Visualization</TabsTrigger>
          <TabsTrigger value="cyp450">CYP450 Pathways</TabsTrigger>
          <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm">Protein Target</CardTitle>
                <CardDescription>Select HIV protein to visualize</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(HIV_PROTEINS).map(([key, protein]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedProtein(key as keyof typeof HIV_PROTEINS)}
                      className={`
                        w-full p-3 rounded-lg border text-left transition-all
                        ${selectedProtein === key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{protein.name}</span>
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: protein.color, color: protein.color }}
                        >
                          {protein.pdbId}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{protein.description}</p>
                    </button>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Test Drug Binding</p>
                  <div className="space-y-2">
                    {SAMPLE_DRUGS.map((drug) => (
                      <button
                        key={drug.name}
                        onClick={() => {
                          setSelectedDrug(drug);
                          setShowBinding(false);
                        }}
                        className={`
                          w-full p-2 rounded border text-left text-sm transition-all
                          ${selectedDrug?.name === drug.name 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-slate-200 hover:border-slate-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{drug.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{drug.type}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={runSimulation}
                  disabled={!selectedDrug || simulationRunning}
                  className="w-full"
                >
                  {simulationRunning ? (
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Binding Simulation
                </Button>
              </CardContent>
            </Card>

            {/* 3D Viewer */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">3D Structure Viewer</CardTitle>
                  {selectedDrug && (
                    <Badge 
                      variant={showBinding ? "default" : "outline"}
                      className={showBinding ? "bg-purple-600" : ""}
                    >
                      {showBinding ? 'Binding Simulated' : 'Ready'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-slate-900 rounded-lg overflow-hidden">
                  <Canvas camera={{ position: [0, 0, 6] }}>
                    <ambientLight intensity={0.6} />
                    <pointLight position={[10, 10, 10]} />
                    <pointLight position={[-10, -10, -10]} color="#4f46e5" intensity={0.3} />
                    <OrbitControls enableZoom={true} enablePan={true} />
                    <ProteinStructure 
                      protein={selectedProtein}
                      selectedDrug={selectedDrug}
                      showBinding={showBinding}
                    />
                  </Canvas>
                </div>
                
                {selectedDrug && showBinding && (
                  <Alert className="mt-4 bg-purple-50 border-purple-200">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <strong>{selectedDrug.name}</strong> binds to {HIV_PROTEINS[selectedProtein].name} 
                      with Ki = {selectedDrug.affinity} nM
                      {selectedDrug.target !== selectedProtein && (
                        <span className="text-amber-600 block mt-1">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Primary target is {HIV_PROTEINS[selectedDrug.target as keyof typeof HIV_PROTEINS]?.name || selectedDrug.target}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cyp450" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CYP450 & Transporter Interactions</CardTitle>
              <CardDescription>
                Visualize enzyme inhibition and induction patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CYPPathwayVisualizer />
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm font-medium text-red-800 mb-2">Key Inhibitors</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• Ritonavir (RTV): Strong CYP3A4 inhibitor</li>
                    <li>• Cobicistat (COBI): Strong CYP3A4 inhibitor</li>
                    <li>• Dolutegravir (DTG): OCT2/MATE1 inhibitor</li>
                    <li>• Bictegravir (BIC): OCT2/MATE1 inhibitor</li>
                  </ul>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-800 mb-2">Key Inducers</p>
                  <ul className="text-xs text-emerald-700 space-y-1">
                    <li>• Efavirenz (EFV): CYP3A4, CYP2B6 inducer</li>
                    <li>• Etravirine (ETR): CYP3A4, P-gp inducer</li>
                    <li>• Rifampin: Strong CYP3A4 inducer</li>
                    <li>• Carbamazepine: CYP3A4 inducer</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upload Molecular Structure</CardTitle>
              <CardDescription>
                Upload SDF or PDB files for interaction analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-sm font-medium mb-2">Drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground mb-4">Supports SDF, PDB, MOL formats</p>
                <input
                  type="file"
                  accept=".sdf,.pdb,.mol"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select File
                  </label>
                </Button>
              </div>

              {uploadedFile && (
                <Alert className="mt-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Uploaded: <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
