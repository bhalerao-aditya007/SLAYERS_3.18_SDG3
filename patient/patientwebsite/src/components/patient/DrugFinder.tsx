import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Pill, Check, X, Loader2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DrugResult {
  id: string;
  name: string;
  genericName: string;
  pharmacy: string;
  price: number;
  currency: string;
  availability: boolean;
  isCheapest: boolean;
}

export const DrugFinder: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DrugResult[]>([]);

  // Mock API call - replace with actual API integration
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a drug name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - replace with actual API
    setTimeout(() => {
      const mockResults: DrugResult[] = [
        {
          id: '1',
          name: searchQuery,
          genericName: `${searchQuery} Generic`,
          pharmacy: 'Apollo Pharmacy',
          price: 45.50,
          currency: '₹',
          availability: true,
          isCheapest: true,
        },
        {
          id: '2',
          name: searchQuery,
          genericName: `${searchQuery} Generic`,
          pharmacy: 'MedPlus',
          price: 52.00,
          currency: '₹',
          availability: true,
          isCheapest: false,
        },
        {
          id: '3',
          name: searchQuery,
          genericName: `${searchQuery} Generic`,
          pharmacy: 'Netmeds',
          price: 48.75,
          currency: '₹',
          availability: false,
          isCheapest: false,
        },
        {
          id: '4',
          name: searchQuery,
          genericName: `${searchQuery} Generic`,
          pharmacy: '1mg',
          price: 55.00,
          currency: '₹',
          availability: true,
          isCheapest: false,
        },
      ];
      
      setResults(mockResults.sort((a, b) => a.price - b.price));
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="card-medical animate-fade-in">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        {t('searchCheapestDrug')}
      </h3>
      
      <div className="flex gap-3 mb-6">
        <Input
          placeholder={t('enterDrugName')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              {t('search')}
            </>
          )}
        </Button>
      </div>
      
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((drug) => (
            <div
              key={drug.id}
              className={`relative p-4 rounded-lg border ${
                drug.isCheapest
                  ? 'border-success bg-success/5'
                  : 'border-border bg-secondary/50'
              }`}
            >
              {drug.isCheapest && (
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success text-success-foreground">
                    <Star className="h-3 w-3" />
                    {t('cheapestOption')}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{drug.name}</p>
                    <p className="text-sm text-muted-foreground">{drug.pharmacy}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold">
                    {drug.currency}{drug.price.toFixed(2)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      drug.availability ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {drug.availability ? (
                      <>
                        <Check className="h-3 w-3" />
                        {t('inStock')}
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        {t('outOfStock')}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isLoading && results.length === 0 && searchQuery && (
        <p className="text-center text-muted-foreground py-8">
          {t('enterDrugName')}
        </p>
      )}
    </div>
  );
};
