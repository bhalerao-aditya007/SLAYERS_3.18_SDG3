import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TestTube, CheckCircle, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Test {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'pending' | 'scheduled';
  result?: string;
}

interface TestsListProps {
  tests: Test[];
}

export const TestsList: React.FC<TestsListProps> = ({ tests }) => {
  const { t } = useLanguage();

  const getStatusIcon = (status: Test['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-info" />;
    }
  };

  const getStatusBadge = (status: Test['status']) => {
    const statusMap = {
      completed: { label: t('completed'), class: 'success-badge' },
      pending: { label: t('pending'), class: 'alert-badge' },
      scheduled: { label: t('scheduled'), class: 'bg-info/15 text-info' },
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusMap[status].class}`}>
        {getStatusIcon(status)}
        {statusMap[status].label}
      </span>
    );
  };

  return (
    <div className="card-medical animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TestTube className="h-5 w-5 text-primary" />
          {t('tests')}
        </h3>
      </div>
      
      <div className="space-y-3">
        {tests.map((test) => (
          <div
            key={test.id}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-medium">{test.name}</p>
              <p className="text-sm text-muted-foreground">{test.date}</p>
            </div>
            <div className="flex items-center gap-4">
              {test.result && (
                <span className="text-sm font-medium">{test.result}</span>
              )}
              {getStatusBadge(test.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
