import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Pill, TestTube, Clock } from 'lucide-react';

interface DashboardStatsProps {
  lastTreatmentDate: string;
  nextAppointment: string;
  activeMedications: number;
  pendingTests: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  lastTreatmentDate,
  nextAppointment,
  activeMedications,
  pendingTests,
}) => {
  const { t } = useLanguage();

  const stats = [
    {
      icon: Calendar,
      label: t('lastTreatment'),
      value: lastTreatmentDate,
      iconClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
    {
      icon: Clock,
      label: t('nextAppointment'),
      value: nextAppointment,
      iconClass: 'text-info',
      bgClass: 'bg-info/10',
    },
    {
      icon: Pill,
      label: t('activeMedications'),
      value: activeMedications.toString(),
      iconClass: 'text-success',
      bgClass: 'bg-success/10',
    },
    {
      icon: TestTube,
      label: t('pendingTests'),
      value: pendingTests.toString(),
      iconClass: 'text-warning',
      bgClass: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-md ${stat.bgClass}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconClass}`} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="text-xl font-semibold mt-1">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
