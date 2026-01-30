import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Mail, Phone, Plus, Trash2, Send, Loader2, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LovedOne {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

interface AlertSettings {
  patientEmail: string;
  patientPhone: string;
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
  lovedOnes: LovedOne[];
}

interface AlertSystemProps {
  initialSettings?: AlertSettings;
  onSendAlert?: (type: string, recipients: string[]) => Promise<void>;
}

export const AlertSystem: React.FC<AlertSystemProps> = ({ 
  initialSettings,
  onSendAlert 
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AlertSettings>(
    initialSettings || {
      patientEmail: '',
      patientPhone: '',
      enableEmailAlerts: true,
      enableSmsAlerts: true,
      lovedOnes: [],
    }
  );
  
  const [newLovedOne, setNewLovedOne] = useState<Omit<LovedOne, 'id'>>({
    name: '',
    email: '',
    phone: '',
    relationship: '',
  });
  
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string>('medicationReminder');

  const handleAddLovedOne = () => {
    if (!newLovedOne.name || (!newLovedOne.email && !newLovedOne.phone)) {
      toast({
        title: 'Error',
        description: 'Please provide name and at least email or phone',
        variant: 'destructive',
      });
      return;
    }

    const newContact: LovedOne = {
      ...newLovedOne,
      id: Date.now().toString(),
    };

    setSettings({
      ...settings,
      lovedOnes: [...settings.lovedOnes, newContact],
    });

    setNewLovedOne({ name: '', email: '', phone: '', relationship: '' });
    setIsAddingContact(false);

    toast({
      title: 'Contact Added',
      description: `${newContact.name} has been added to your emergency contacts.`,
    });
  };

  const handleRemoveLovedOne = (id: string) => {
    setSettings({
      ...settings,
      lovedOnes: settings.lovedOnes.filter((lo) => lo.id !== id),
    });
  };

  const handleSendAlert = async () => {
    if (!settings.patientEmail && !settings.patientPhone) {
      toast({
        title: 'Error',
        description: 'Please configure at least one contact method',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    // Simulate API call - replace with actual API integration
    try {
      if (onSendAlert) {
        const recipients = [
          settings.patientEmail,
          settings.patientPhone,
          ...settings.lovedOnes.map((lo) => lo.email).filter(Boolean),
          ...settings.lovedOnes.map((lo) => lo.phone).filter(Boolean),
        ].filter(Boolean);

        await onSendAlert(selectedAlertType, recipients);
      } else {
        // Mock delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      toast({
        title: t('alertSent'),
        description: `${t(selectedAlertType)} sent to all configured contacts.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send alert. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card-medical animate-fade-in">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-warning" />
        {t('alertSettings')}
      </h3>

      <div className="space-y-6">
        {/* Patient Contact */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Patient Contact
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                {t('patientEmail')}
              </label>
              <Input
                type="email"
                placeholder="patient@email.com"
                value={settings.patientEmail}
                onChange={(e) =>
                  setSettings({ ...settings, patientEmail: e.target.value })
                }
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                {t('patientPhone')}
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={settings.patientPhone}
                onChange={(e) =>
                  setSettings({ ...settings, patientPhone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="emailAlerts"
                checked={settings.enableEmailAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableEmailAlerts: !!checked })
                }
              />
              <label htmlFor="emailAlerts" className="text-sm">
                Enable Email Alerts
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="smsAlerts"
                checked={settings.enableSmsAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableSmsAlerts: !!checked })
                }
              />
              <label htmlFor="smsAlerts" className="text-sm">
                Enable SMS Alerts
              </label>
            </div>
          </div>
        </div>

        {/* Loved Ones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t('lovedOnes')}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingContact(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('addContact')}
            </Button>
          </div>

          {isAddingContact && (
            <div className="p-4 border border-border rounded-lg bg-secondary/30 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  placeholder={t('name')}
                  value={newLovedOne.name}
                  onChange={(e) =>
                    setNewLovedOne({ ...newLovedOne, name: e.target.value })
                  }
                />
                <Input
                  placeholder={t('relationship')}
                  value={newLovedOne.relationship}
                  onChange={(e) =>
                    setNewLovedOne({ ...newLovedOne, relationship: e.target.value })
                  }
                />
                <Input
                  type="email"
                  placeholder={t('email')}
                  value={newLovedOne.email}
                  onChange={(e) =>
                    setNewLovedOne({ ...newLovedOne, email: e.target.value })
                  }
                />
                <Input
                  type="tel"
                  placeholder={t('phone')}
                  value={newLovedOne.phone}
                  onChange={(e) =>
                    setNewLovedOne({ ...newLovedOne, phone: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingContact(false);
                    setNewLovedOne({ name: '', email: '', phone: '', relationship: '' });
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleAddLovedOne}>
                  {t('save')}
                </Button>
              </div>
            </div>
          )}

          {settings.lovedOnes.length > 0 ? (
            <div className="space-y-2">
              {settings.lovedOnes.map((lovedOne) => (
                <div
                  key={lovedOne.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {lovedOne.name}
                      {lovedOne.relationship && (
                        <span className="text-muted-foreground ml-2">
                          ({lovedOne.relationship})
                        </span>
                      )}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {lovedOne.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lovedOne.email}
                        </span>
                      )}
                      {lovedOne.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lovedOne.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLovedOne(lovedOne.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No emergency contacts added yet
            </p>
          )}
        </div>

        {/* Send Test Alert */}
        <div className="pt-4 border-t border-border space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t('sendAlerts')}
          </h4>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedAlertType} onValueChange={setSelectedAlertType}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select alert type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medicationReminder">
                  {t('medicationReminder')}
                </SelectItem>
                <SelectItem value="appointmentReminder">
                  {t('appointmentReminder')}
                </SelectItem>
                <SelectItem value="testResultReady">
                  {t('testResultReady')}
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSendAlert} disabled={isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t('sendTestAlert')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
