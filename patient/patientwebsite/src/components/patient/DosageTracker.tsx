import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Sunset, Moon, Utensils } from 'lucide-react';

interface Dosage {
  time: 'morning' | 'afternoon' | 'night';
  quantity: number;
  beforeFood: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosages: Dosage[];
}

interface DosageTrackerProps {
  medications: Medication[];
}

const TimeIcon: React.FC<{ time: 'morning' | 'afternoon' | 'night' }> = ({ time }) => {
  switch (time) {
    case 'morning':
      return <Sun className="h-4 w-4" />;
    case 'afternoon':
      return <Sunset className="h-4 w-4" />;
    case 'night':
      return <Moon className="h-4 w-4" />;
  }
};

export const DosageTracker: React.FC<DosageTrackerProps> = ({ medications }) => {
  const { t } = useLanguage();

  const getTimeLabel = (time: 'morning' | 'afternoon' | 'night') => {
    return t(time);
  };

  const getDosageClass = (time: 'morning' | 'afternoon' | 'night') => {
    switch (time) {
      case 'morning':
        return 'dosage-morning';
      case 'afternoon':
        return 'dosage-afternoon';
      case 'night':
        return 'dosage-night';
    }
  };

  return (
    <div className="card-medical animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">{t('dosageSchedule')}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t('medications')}
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Sun className="h-4 w-4 text-morning" />
                  {t('morning')}
                </div>
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Sunset className="h-4 w-4 text-afternoon" />
                  {t('afternoon')}
                </div>
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Moon className="h-4 w-4 text-night" />
                  {t('night')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med) => (
              <tr key={med.id} className="border-b border-border last:border-0">
                <td className="py-4 px-4">
                  <span className="font-medium">{med.name}</span>
                </td>
                {(['morning', 'afternoon', 'night'] as const).map((time) => {
                  const dosage = med.dosages.find((d) => d.time === time);
                  return (
                    <td key={time} className="py-4 px-4 text-center">
                      {dosage ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className={`dosage-badge ${getDosageClass(time)}`}>
                            {dosage.quantity} {t('tablets')}
                          </span>
                          <span className={`text-xs ${dosage.beforeFood ? 'food-before' : 'food-after'} px-2 py-0.5 rounded`}>
                            <Utensils className="h-3 w-3 inline mr-1" />
                            {dosage.beforeFood ? t('beforeFood') : t('afterFood')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
