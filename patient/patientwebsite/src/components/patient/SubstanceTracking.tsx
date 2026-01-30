import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wine, Pill, AlertTriangle } from 'lucide-react';

interface SubstanceData {
  alcohol: {
    frequency: 'never' | 'occasionally' | 'regularly';
    lastRecorded: string | null;
  };
  drugs: {
    frequency: 'never' | 'occasionally' | 'regularly';
    lastRecorded: string | null;
    notes?: string;
  };
}

interface SubstanceTrackingProps {
  data: SubstanceData;
}

export const SubstanceTracking: React.FC<SubstanceTrackingProps> = ({ data }) => {
  const { t } = useLanguage();

  const getFrequencyLabel = (freq: 'never' | 'occasionally' | 'regularly') => {
    return t(freq);
  };

  const getFrequencyBadge = (freq: 'never' | 'occasionally' | 'regularly') => {
    const classes = {
      never: 'success-badge',
      occasionally: 'alert-badge',
      regularly: 'bg-destructive/15 text-destructive',
    };
    return classes[freq];
  };

  return (
    <div className="card-medical animate-fade-in">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        {t('substanceTracking')}
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-warning/10 rounded-md">
              <Wine className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-medium">{t('alcoholConsumption')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('frequency')}:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyBadge(data.alcohol.frequency)}`}>
                {getFrequencyLabel(data.alcohol.frequency)}
              </span>
            </div>
            {data.alcohol.lastRecorded && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('lastRecorded')}:</span>
                <span className="text-sm">{data.alcohol.lastRecorded}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-destructive/10 rounded-md">
              <Pill className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium">{t('drugUse')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('frequency')}:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyBadge(data.drugs.frequency)}`}>
                {getFrequencyLabel(data.drugs.frequency)}
              </span>
            </div>
            {data.drugs.lastRecorded && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('lastRecorded')}:</span>
                <span className="text-sm">{data.drugs.lastRecorded}</span>
              </div>
            )}
            {data.drugs.notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">{data.drugs.notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
