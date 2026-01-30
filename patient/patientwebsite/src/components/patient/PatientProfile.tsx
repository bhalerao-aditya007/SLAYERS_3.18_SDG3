import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Phone, Mail, MapPin, Heart, Droplets } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PatientData {
  id: string;
  name: string;
  age: number;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  avatar?: string;
}

interface PatientProfileProps {
  patient: PatientData;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({ patient }) => {
  const { t } = useLanguage();

  return (
    <div className="card-medical animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={patient.avatar} alt={patient.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">
              {t('patientId')}: {patient.id}
            </p>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-md">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('age')}</p>
              <p className="font-medium">{patient.age} {t('years')}</p>
            </div>
          </div>
          
          <div className="stat-card flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-md">
              <Droplets className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('bloodGroup')}</p>
              <p className="font-medium">{patient.bloodGroup}</p>
            </div>
          </div>
          
          <div className="stat-card flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-md">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('phone')}</p>
              <p className="font-medium text-sm">{patient.phone}</p>
            </div>
          </div>
          
          <div className="stat-card flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-md">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('email')}</p>
              <p className="font-medium text-sm truncate max-w-[120px]">{patient.email}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border grid md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">{t('address')}</p>
            <p className="text-sm">{patient.address}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Heart className="h-4 w-4 text-destructive mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">{t('emergencyContact')}</p>
            <p className="text-sm font-medium">{patient.emergencyContact.name} ({patient.emergencyContact.relationship})</p>
            <p className="text-sm text-muted-foreground">{patient.emergencyContact.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
