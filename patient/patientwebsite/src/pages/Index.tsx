import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/patient/LanguageToggle';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { DashboardStats } from '@/components/patient/DashboardStats';
import { DosageTracker } from '@/components/patient/DosageTracker';
import { TestsList } from '@/components/patient/TestsList';
import { SubstanceTracking } from '@/components/patient/SubstanceTracking';
import { DrugFinder } from '@/components/patient/DrugFinder';
import { AlertSystem } from '@/components/patient/AlertSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Pill, TestTube, Bell, Search, Activity } from 'lucide-react';

// Mock data - replace with actual API data
const mockPatient = {
  id: 'PAT-2024-001',
  name: 'Rajesh Kumar',
  age: 45,
  bloodGroup: 'B+',
  phone: '+91 98765 43210',
  email: 'rajesh.kumar@email.com',
  address: '123, Gandhi Nagar, New Delhi - 110001',
  emergencyContact: {
    name: 'Priya Kumar',
    phone: '+91 98765 43211',
    relationship: 'Spouse',
  },
};

const mockMedications = [
  {
    id: '1',
    name: 'Metformin 500mg',
    dosages: [
      { time: 'morning' as const, quantity: 1, beforeFood: true },
      { time: 'night' as const, quantity: 1, beforeFood: false },
    ],
  },
  {
    id: '2',
    name: 'Amlodipine 5mg',
    dosages: [
      { time: 'morning' as const, quantity: 1, beforeFood: false },
    ],
  },
  {
    id: '3',
    name: 'Atorvastatin 20mg',
    dosages: [
      { time: 'night' as const, quantity: 1, beforeFood: false },
    ],
  },
  {
    id: '4',
    name: 'Pantoprazole 40mg',
    dosages: [
      { time: 'morning' as const, quantity: 1, beforeFood: true },
    ],
  },
];

const mockTests = [
  { id: '1', name: 'HbA1c', date: '2026-01-15', status: 'completed' as const, result: '7.2%' },
  { id: '2', name: 'Lipid Profile', date: '2026-01-15', status: 'completed' as const, result: 'Normal' },
  { id: '3', name: 'Liver Function Test', date: '2026-01-28', status: 'scheduled' as const },
  { id: '4', name: 'Kidney Function Test', date: '2026-01-28', status: 'scheduled' as const },
  { id: '5', name: 'ECG', date: '2026-01-10', status: 'completed' as const, result: 'Normal Sinus Rhythm' },
];

const mockSubstanceData = {
  alcohol: {
    frequency: 'occasionally' as const,
    lastRecorded: '2026-01-10',
  },
  drugs: {
    frequency: 'never' as const,
    lastRecorded: null,
    notes: 'No history of substance abuse',
  },
};

const PatientDashboardContent: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-md">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {t('patientDashboard')}
              </h1>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Patient Profile */}
        <div className="mb-6">
          <PatientProfile patient={mockPatient} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border p-1 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">{t('medications')}</span>
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tests')}</span>
            </TabsTrigger>
            <TabsTrigger value="drugfinder" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t('drugFinder')}</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('alerts')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats
              lastTreatmentDate="Jan 15, 2026"
              nextAppointment="Feb 10, 2026"
              activeMedications={4}
              pendingTests={2}
            />
            <div className="grid lg:grid-cols-2 gap-6">
              <DosageTracker medications={mockMedications} />
              <SubstanceTracking data={mockSubstanceData} />
            </div>
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <DosageTracker medications={mockMedications} />
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <TestsList tests={mockTests} />
          </TabsContent>

          <TabsContent value="drugfinder" className="space-y-6">
            <DrugFinder />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertSystem
              initialSettings={{
                patientEmail: mockPatient.email,
                patientPhone: mockPatient.phone,
                enableEmailAlerts: true,
                enableSmsAlerts: true,
                lovedOnes: [
                  {
                    id: '1',
                    name: mockPatient.emergencyContact.name,
                    email: 'priya.kumar@email.com',
                    phone: mockPatient.emergencyContact.phone,
                    relationship: mockPatient.emergencyContact.relationship,
                  },
                ],
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Patient Health Dashboard • Secure & Confidential
        </div>
      </footer>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <LanguageProvider>
      <PatientDashboardContent />
    </LanguageProvider>
  );
};

export default Index;
