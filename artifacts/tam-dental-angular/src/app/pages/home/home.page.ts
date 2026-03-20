import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Linking } from '@capacitor/core';
import { AppDataService } from '../../services/app-data.service';
import { LanguageService } from '../../services/language.service';
import { Appointment, Invoice, Questionnaire } from '../../models';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  nextAppointment: Appointment | null = null;
  unpaidInvoices: Invoice[] = [];
  pendingForms: Questionnaire[] = [];
  greeting = '';

  readonly clinicPhone = '+966XXXXXXXXX';
  readonly whatsappNumber = '966XXXXXXXXX';

  constructor(
    public langService: LanguageService,
    public dataService: AppDataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const upcoming = this.dataService.getUpcomingAppointments();
    this.nextAppointment = upcoming[0] ?? null;
    this.unpaidInvoices = this.dataService.getUnpaidInvoices();
    this.pendingForms = this.dataService.getPendingQuestionnaires();
    this.setGreeting();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = this.langService.t('goodMorning');
    else if (hour < 17) this.greeting = this.langService.t('goodAfternoon');
    else this.greeting = this.langService.t('goodEvening');
  }

  get patientDisplayName(): string {
    return this.langService.language === 'ar'
      ? this.dataService.patient.nameAr
      : this.dataService.patient.name;
  }

  callClinic(): void {
    window.location.href = `tel:${this.clinicPhone}`;
  }

  openWhatsApp(): void {
    window.open(`https://wa.me/${this.whatsappNumber}`, '_blank');
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
