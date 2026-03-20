import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Appointment, FamilyMember, Invoice, Patient, Prescription, Questionnaire } from '../models';

@Injectable({ providedIn: 'root' })
export class AppDataService {
  readonly patient: Patient = {
    id: 'P-001',
    name: 'Mohammed Al-Rashidi',
    nameAr: 'محمد الرشيدي',
    phone: '+966501234567',
    email: 'mohammed.rashidi@example.com',
    dateOfBirth: '15/05/1990',
    recordNumber: 'TAM-2024-00142',
  };

  private appointmentsSubject = new BehaviorSubject<Appointment[]>([
    {
      id: 'A-001',
      doctorName: 'Dr. Fatima Al-Zahrani',
      doctorSpecialty: 'General Dentist',
      date: '2025-04-10',
      time: '10:30 AM',
      status: 'upcoming',
      location: 'TAM Dental – Riyadh Branch',
      notes: 'Routine check-up and cleaning.',
      checkedIn: false,
    },
    {
      id: 'A-002',
      doctorName: 'Dr. Ahmed Al-Ghamdi',
      doctorSpecialty: 'Orthodontist',
      date: '2025-04-22',
      time: '2:00 PM',
      status: 'upcoming',
      location: 'TAM Dental – Riyadh Branch',
      checkedIn: false,
    },
    {
      id: 'A-003',
      doctorName: 'Dr. Fatima Al-Zahrani',
      doctorSpecialty: 'General Dentist',
      date: '2024-12-05',
      time: '11:00 AM',
      status: 'completed',
      location: 'TAM Dental – Riyadh Branch',
    },
  ]);

  private invoicesSubject = new BehaviorSubject<Invoice[]>([
    {
      id: 'INV-2025-001',
      date: '2025-03-15',
      amount: 850,
      currency: 'SAR',
      status: 'unpaid',
      description: 'Dental Cleaning & Check-up',
      items: [
        { name: 'Scaling & Polishing', amount: 500 },
        { name: 'X-Ray (2 films)', amount: 200 },
        { name: 'Consultation Fee', amount: 150 },
      ],
    },
    {
      id: 'INV-2024-098',
      date: '2024-12-05',
      amount: 1200,
      currency: 'SAR',
      status: 'paid',
      description: 'Root Canal Treatment',
      items: [
        { name: 'Root Canal - Molar', amount: 1000 },
        { name: 'Temporary Filling', amount: 200 },
      ],
    },
  ]);

  private prescriptionsSubject = new BehaviorSubject<Prescription[]>([
    {
      id: 'RX-2025-014',
      date: '2025-03-15',
      doctorName: 'Dr. Fatima Al-Zahrani',
      doctorSignature: 'Dr. F. Al-Zahrani, BDS',
      medications: [
        { name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: '3 times daily', duration: '7 days' },
        { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'As needed (max 3/day)', duration: '5 days' },
      ],
      notes: 'Take antibiotics with food. Complete full course.',
    },
  ]);

  private questionnairesSubject = new BehaviorSubject<Questionnaire[]>([
    { id: 'Q-001', title: 'Medical History Form', titleAr: 'استمارة التاريخ الطبي', status: 'pending', dueDate: '2025-04-10' },
    { id: 'Q-002', title: 'Treatment Consent', titleAr: 'موافقة على العلاج', status: 'pending' },
    { id: 'Q-003', title: 'Patient Satisfaction Survey', titleAr: 'استبيان رضا المريض', status: 'completed' },
  ]);

  private familyMembersSubject = new BehaviorSubject<FamilyMember[]>([]);

  appointments$ = this.appointmentsSubject.asObservable();
  invoices$ = this.invoicesSubject.asObservable();
  prescriptions$ = this.prescriptionsSubject.asObservable();
  questionnaires$ = this.questionnairesSubject.asObservable();
  familyMembers$ = this.familyMembersSubject.asObservable();

  get appointments(): Appointment[] { return this.appointmentsSubject.getValue(); }
  get invoices(): Invoice[] { return this.invoicesSubject.getValue(); }
  get prescriptions(): Prescription[] { return this.prescriptionsSubject.getValue(); }
  get questionnaires(): Questionnaire[] { return this.questionnairesSubject.getValue(); }
  get familyMembers(): FamilyMember[] { return this.familyMembersSubject.getValue(); }

  getUpcomingAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status === 'upcoming');
  }

  getPastAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status !== 'upcoming');
  }

  getUnpaidInvoices(): Invoice[] {
    return this.invoices.filter(i => i.status !== 'paid');
  }

  getPendingQuestionnaires(): Questionnaire[] {
    return this.questionnaires.filter(q => q.status === 'pending');
  }

  checkInAppointment(id: string): void {
    const list = this.appointments.map(a =>
      a.id === id ? { ...a, checkedIn: true } : a
    );
    this.appointmentsSubject.next(list);
  }

  cancelAppointment(id: string): void {
    const list = this.appointments.map(a =>
      a.id === id ? { ...a, status: 'cancelled' as const } : a
    );
    this.appointmentsSubject.next(list);
  }

  addFamilyMember(member: FamilyMember): void {
    this.familyMembersSubject.next([...this.familyMembers, member]);
  }

  removeFamilyMember(id: string): void {
    this.familyMembersSubject.next(this.familyMembers.filter(m => m.id !== id));
  }
}
