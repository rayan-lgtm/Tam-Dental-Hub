export interface Patient {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  recordNumber: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  location: string;
  notes?: string;
  checkedIn?: boolean;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'partial';
  description: string;
  items: { name: string; amount: number }[];
}

export interface Prescription {
  id: string;
  date: string;
  doctorName: string;
  doctorSignature: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  notes?: string;
}

export interface Questionnaire {
  id: string;
  title: string;
  titleAr: string;
  status: 'pending' | 'completed';
  dueDate?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  nameAr: string;
  nationalId: string;
  dateOfBirth: string;
  relationship: string;
}

export type Language = 'en' | 'ar';
