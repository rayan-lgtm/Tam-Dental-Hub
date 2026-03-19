import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Patient = {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  recordNumber: string;
};

export type Appointment = {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  location: string;
  notes?: string;
  checkedIn?: boolean;
};

export type Invoice = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "unpaid" | "partial";
  description: string;
  items: { name: string; amount: number }[];
};

export type Prescription = {
  id: string;
  date: string;
  doctorName: string;
  doctorSignature: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  notes?: string;
};

export type Questionnaire = {
  id: string;
  title: string;
  type: "medical_history" | "consent" | "satisfaction";
  status: "pending" | "completed";
  dueDate: string;
};

type AppContextType = {
  patient: Patient;
  appointments: Appointment[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  questionnaires: Questionnaire[];
  checkinAppointment: (id: string) => void;
  cancelAppointment: (id: string) => void;
  confirmAppointment: (id: string) => void;
  payInvoice: (id: string) => void;
};

const MOCK_PATIENT: Patient = {
  id: "P-001",
  name: "Ahmed Al-Rashidi",
  nameAr: "أحمد الراشدي",
  phone: "+966 55 123 4567",
  email: "ahmed@example.com",
  dateOfBirth: "1988-03-15",
  recordNumber: "TAM-2024-00142",
};

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "APT-001",
    doctorName: "Dr. Sarah Al-Farsi",
    doctorSpecialty: "Orthodontist",
    date: "2026-03-25",
    time: "10:00 AM",
    status: "upcoming",
    location: "TAM Dental, Riyadh Branch",
    notes: "Follow-up for braces adjustment",
    checkedIn: false,
  },
  {
    id: "APT-002",
    doctorName: "Dr. Khalid Mansour",
    doctorSpecialty: "General Dentist",
    date: "2026-04-02",
    time: "2:30 PM",
    status: "upcoming",
    location: "TAM Dental, Jeddah Branch",
    checkedIn: false,
  },
  {
    id: "APT-003",
    doctorName: "Dr. Nora Al-Zahrani",
    doctorSpecialty: "Periodontist",
    date: "2026-02-10",
    time: "11:00 AM",
    status: "completed",
    location: "TAM Dental, Riyadh Branch",
  },
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: "INV-2024-001",
    date: "2026-02-10",
    amount: 850,
    currency: "SAR",
    status: "paid",
    description: "Periodontal Treatment",
    items: [
      { name: "Scaling & Root Planing", amount: 650 },
      { name: "Consultation Fee", amount: 200 },
    ],
  },
  {
    id: "INV-2024-002",
    date: "2026-03-01",
    amount: 2400,
    currency: "SAR",
    status: "unpaid",
    description: "Orthodontic Treatment - Month 3",
    items: [
      { name: "Monthly Adjustment", amount: 400 },
      { name: "Retainer", amount: 2000 },
    ],
  },
  {
    id: "INV-2024-003",
    date: "2026-01-15",
    amount: 1200,
    currency: "SAR",
    status: "partial",
    description: "Cosmetic Whitening Package",
    items: [
      { name: "In-Office Whitening", amount: 800 },
      { name: "Home Kit", amount: 400 },
    ],
  },
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "RX-001",
    date: "2026-02-10",
    doctorName: "Dr. Nora Al-Zahrani",
    doctorSignature: "NAZ",
    medications: [
      { name: "Amoxicillin 500mg", dosage: "500mg", frequency: "3x daily", duration: "7 days" },
      { name: "Ibuprofen 400mg", dosage: "400mg", frequency: "As needed", duration: "5 days" },
    ],
    notes: "Take with food. Complete full course of antibiotics.",
  },
  {
    id: "RX-002",
    date: "2026-01-20",
    doctorName: "Dr. Sarah Al-Farsi",
    doctorSignature: "SAF",
    medications: [
      { name: "Chlorhexidine Mouthwash", dosage: "10ml", frequency: "2x daily", duration: "14 days" },
    ],
    notes: "Rinse for 30 seconds after brushing.",
  },
];

const MOCK_QUESTIONNAIRES: Questionnaire[] = [
  {
    id: "Q-001",
    title: "Medical History Update",
    type: "medical_history",
    status: "pending",
    dueDate: "2026-03-24",
  },
  {
    id: "Q-002",
    title: "Treatment Consent Form",
    type: "consent",
    status: "pending",
    dueDate: "2026-03-24",
  },
  {
    id: "Q-003",
    title: "Patient Satisfaction Survey",
    type: "satisfaction",
    status: "completed",
    dueDate: "2026-02-15",
  },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);

  const checkinAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, checkedIn: true } : a))
    );
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
  }, []);

  const confirmAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "upcoming" } : a))
    );
  }, []);

  const payInvoice = useCallback((id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "paid" } : inv))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        patient: MOCK_PATIENT,
        appointments,
        invoices,
        prescriptions: MOCK_PRESCRIPTIONS,
        questionnaires: MOCK_QUESTIONNAIRES,
        checkinAppointment,
        cancelAppointment,
        confirmAppointment,
        payInvoice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
