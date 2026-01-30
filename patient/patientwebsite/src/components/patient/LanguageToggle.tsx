import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <div className="flex border border-border rounded-md overflow-hidden">
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('en')}
          className="rounded-none text-xs px-3"
        >
          EN
        </Button>
        <Button
          variant={language === 'hi' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('hi')}
          className="rounded-none text-xs px-3"
        >
          हिं
        </Button>
      </div>
    </div>
  );
};
