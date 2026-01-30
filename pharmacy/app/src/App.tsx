import { useState } from 'react';
import { 
  Beaker, 
  Activity, 
  Database, 
  FlaskConical, 
  Pill, 
  FileText, 
  Menu,
  Microscope,
  ChevronRight,
  ArrowDown,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Import modules
import MolecularLab from '@/sections/MolecularLab';
import PKSimulator from '@/sections/PKSimulator';
import EvidenceDashboard from '@/sections/EvidenceDashboard';
import TrialMatching from '@/sections/TrialMatching';
import FormulationOptimizer from '@/sections/FormulationOptimizer';
import RegulatoryTools from '@/sections/RegulatoryTools';

import './App.css';

type ModuleType = 'molecular' | 'pk' | 'evidence' | 'trials' | 'formulation' | 'regulatory';

interface ModuleConfig {
  id: ModuleType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

const modules: ModuleConfig[] = [
  {
    id: 'molecular',
    title: '3D Molecular Simulation Lab',
    subtitle: 'Virtual Drug-Drug Interaction Modeling',
    icon: Microscope,
    description: 'Upload molecular structures, simulate binding to HIV proteins, predict interaction potential',
    color: 'bg-blue-500'
  },
  {
    id: 'pk',
    title: 'Pharmacokinetic Simulator',
    subtitle: 'Drug Concentration & Interaction Modeling',
    icon: Activity,
    description: 'Model drug concentration curves, predict interactions, test dosing schedules',
    color: 'bg-emerald-500'
  },
  {
    id: 'evidence',
    title: 'Real-World Evidence Dashboard',
    subtitle: 'Clinical Analytics & Query Engine',
    icon: Database,
    description: 'Searchable analytics with natural language queries for clinical insights',
    color: 'bg-violet-500'
  },
  {
    id: 'trials',
    title: 'Clinical Trial Matching',
    subtitle: 'Patient Eligibility & Surveillance',
    icon: FlaskConical,
    description: 'Identify trial eligibility, track investigational drug performance',
    color: 'bg-amber-500'
  },
  {
    id: 'formulation',
    title: 'Formulation Optimizer',
    subtitle: 'Adherence & FDC Analysis',
    icon: Pill,
    description: 'Analyze adherence by formulation type, check FDC feasibility',
    color: 'bg-rose-500'
  },
  {
    id: 'regulatory',
    title: 'Regulatory & Reporting Tools',
    subtitle: 'Automated Report Generation',
    icon: FileText,
    description: 'Generate adverse event reports, compile interaction case summaries',
    color: 'bg-cyan-500'
  }
];

// Hero Section Component
function HeroSection({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
      />
      
      {/* Gradient Mask - Light to Dark, Top to Bottom */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 40%, rgba(15,23,42,0.6) 100%)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Badge className="bg-blue-600/90 text-white border-0 px-4 py-1.5 text-sm font-medium mb-6">
            NYSDOH AI 2025 Guidelines
          </Badge>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
          HIV Drug Interaction
          <span className="block text-blue-600">& PK Platform</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-700 mb-4 max-w-2xl mx-auto font-light">
          Clinical-grade drug interaction and pharmacokinetics platform for HIV care
        </p>
        
        <p className="text-base text-slate-600 mb-10 max-w-xl mx-auto">
          3D molecular simulation • PK modeling • Real-world evidence • Trial matching • Regulatory reporting
        </p>
        
        <Button 
          onClick={onEnter}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
        >
          Enter Platform
          <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
        </Button>
      </div>
      
      {/* Bottom gradient for smooth transition */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(248,250,252,1) 0%, rgba(248,250,252,0) 100%)'
        }}
      />
    </div>
  );
}

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('molecular');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHero, setShowHero] = useState(true);

  const activeConfig = modules.find(m => m.id === activeModule)!;

  const renderModule = () => {
    switch (activeModule) {
      case 'molecular':
        return <MolecularLab />;
      case 'pk':
        return <PKSimulator />;
      case 'evidence':
        return <EvidenceDashboard />;
      case 'trials':
        return <TrialMatching />;
      case 'formulation':
        return <FormulationOptimizer />;
      case 'regulatory':
        return <RegulatoryTools />;
      default:
        return <MolecularLab />;
    }
  };

  const handleEnterPlatform = () => {
    setShowHero(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Beaker className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="font-bold text-lg leading-tight">HIV Drug Interaction</h1>
            <p className="text-xs text-muted-foreground">& Pharmacokinetics Platform</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-3 py-2">MODULES</p>
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => {
                  setActiveModule(module.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'hover:bg-slate-50 text-slate-700'
                  }
                `}
              >
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{module.title}</p>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">NYSDOH 2025</Badge>
          <span>•</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );

  // Show hero page first
  if (showHero) {
    return <HeroSection onEnter={handleEnterPlatform} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 bg-white border-r h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
          <div className="flex items-center gap-4 px-4 py-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeConfig.color} text-white`}>
                <activeConfig.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{activeConfig.title}</h2>
                <p className="text-sm text-muted-foreground">{activeConfig.subtitle}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Module Content */}
        <div className="p-4 lg:p-6">
          {renderModule()}
        </div>
      </main>
    </div>
  );
}

export default App;
