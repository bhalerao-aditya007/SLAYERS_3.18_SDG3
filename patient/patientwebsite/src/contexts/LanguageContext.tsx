import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Navigation & Headers
  patientDashboard: { en: 'Patient Dashboard', hi: 'रोगी डैशबोर्ड' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  medications: { en: 'Medications', hi: 'दवाइयाँ' },
  tests: { en: 'Tests', hi: 'परीक्षण' },
  alerts: { en: 'Alerts', hi: 'अलर्ट' },
  drugFinder: { en: 'Drug Finder', hi: 'दवा खोजक' },
  
  // Profile Section
  patientId: { en: 'Patient ID', hi: 'रोगी आईडी' },
  age: { en: 'Age', hi: 'आयु' },
  years: { en: 'years', hi: 'वर्ष' },
  bloodGroup: { en: 'Blood Group', hi: 'रक्त समूह' },
  phone: { en: 'Phone', hi: 'फ़ोन' },
  email: { en: 'Email', hi: 'ईमेल' },
  address: { en: 'Address', hi: 'पता' },
  emergencyContact: { en: 'Emergency Contact', hi: 'आपातकालीन संपर्क' },
  
  // Dashboard
  lastTreatment: { en: 'Last Treatment', hi: 'अंतिम उपचार' },
  nextAppointment: { en: 'Next Appointment', hi: 'अगली अपॉइंटमेंट' },
  activeMedications: { en: 'Active Medications', hi: 'सक्रिय दवाइयाँ' },
  pendingTests: { en: 'Pending Tests', hi: 'लंबित परीक्षण' },
  
  // Dosage
  dosageSchedule: { en: 'Dosage Schedule', hi: 'खुराक अनुसूची' },
  morning: { en: 'Morning', hi: 'सुबह' },
  afternoon: { en: 'Afternoon', hi: 'दोपहर' },
  night: { en: 'Night', hi: 'रात' },
  beforeFood: { en: 'Before Food', hi: 'भोजन से पहले' },
  afterFood: { en: 'After Food', hi: 'भोजन के बाद' },
  quantity: { en: 'Quantity', hi: 'मात्रा' },
  tablets: { en: 'tablet(s)', hi: 'गोली' },
  
  // Alcohol & Drug Tracking
  substanceTracking: { en: 'Substance Tracking', hi: 'पदार्थ ट्रैकिंग' },
  alcoholConsumption: { en: 'Alcohol Consumption', hi: 'शराब सेवन' },
  drugUse: { en: 'Drug Use', hi: 'नशीली दवाओं का उपयोग' },
  lastRecorded: { en: 'Last Recorded', hi: 'अंतिम रिकॉर्ड' },
  frequency: { en: 'Frequency', hi: 'आवृत्ति' },
  never: { en: 'Never', hi: 'कभी नहीं' },
  occasionally: { en: 'Occasionally', hi: 'कभी-कभी' },
  regularly: { en: 'Regularly', hi: 'नियमित रूप से' },
  none: { en: 'None', hi: 'कोई नहीं' },
  
  // Tests
  testName: { en: 'Test Name', hi: 'परीक्षण का नाम' },
  testDate: { en: 'Test Date', hi: 'परीक्षण तिथि' },
  status: { en: 'Status', hi: 'स्थिति' },
  result: { en: 'Result', hi: 'परिणाम' },
  completed: { en: 'Completed', hi: 'पूर्ण' },
  pending: { en: 'Pending', hi: 'लंबित' },
  scheduled: { en: 'Scheduled', hi: 'निर्धारित' },
  
  // Drug Finder
  searchCheapestDrug: { en: 'Search Cheapest Drug', hi: 'सबसे सस्ती दवा खोजें' },
  enterDrugName: { en: 'Enter drug name', hi: 'दवा का नाम दर्ज करें' },
  search: { en: 'Search', hi: 'खोजें' },
  price: { en: 'Price', hi: 'कीमत' },
  pharmacy: { en: 'Pharmacy', hi: 'फार्मेसी' },
  availability: { en: 'Availability', hi: 'उपलब्धता' },
  inStock: { en: 'In Stock', hi: 'स्टॉक में' },
  outOfStock: { en: 'Out of Stock', hi: 'स्टॉक में नहीं' },
  cheapestOption: { en: 'Cheapest Option', hi: 'सबसे सस्ता विकल्प' },
  
  // Alerts
  alertSettings: { en: 'Alert Settings', hi: 'अलर्ट सेटिंग्स' },
  sendAlerts: { en: 'Send Alerts', hi: 'अलर्ट भेजें' },
  patientEmail: { en: 'Patient Email', hi: 'रोगी ईमेल' },
  patientPhone: { en: 'Patient Phone', hi: 'रोगी फ़ोन' },
  lovedOnes: { en: 'Loved Ones', hi: 'प्रियजन' },
  addContact: { en: 'Add Contact', hi: 'संपर्क जोड़ें' },
  removeContact: { en: 'Remove', hi: 'हटाएं' },
  name: { en: 'Name', hi: 'नाम' },
  relationship: { en: 'Relationship', hi: 'रिश्ता' },
  sendTestAlert: { en: 'Send Test Alert', hi: 'टेस्ट अलर्ट भेजें' },
  alertSent: { en: 'Alert Sent Successfully', hi: 'अलर्ट सफलतापूर्वक भेजा गया' },
  medicationReminder: { en: 'Medication Reminder', hi: 'दवा अनुस्मारक' },
  appointmentReminder: { en: 'Appointment Reminder', hi: 'अपॉइंटमेंट अनुस्मारक' },
  testResultReady: { en: 'Test Result Ready', hi: 'परीक्षण परिणाम तैयार' },
  
  // Actions
  save: { en: 'Save', hi: 'सहेजें' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  edit: { en: 'Edit', hi: 'संपादित करें' },
  delete: { en: 'Delete', hi: 'हटाएं' },
  viewAll: { en: 'View All', hi: 'सभी देखें' },
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...' },
  
  // Language
  language: { en: 'Language', hi: 'भाषा' },
  english: { en: 'English', hi: 'अंग्रेज़ी' },
  hindi: { en: 'Hindi', hi: 'हिंदी' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    console.warn(`Translation missing for key: ${key}`);
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
