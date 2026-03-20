import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AppDataService } from '../../services/app-data.service';
import { LanguageService } from '../../services/language.service';
import { Appointment } from '../../models';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.page.html',
  styleUrls: ['./appointments.page.scss'],
})
export class AppointmentsPage implements OnInit {
  activeTab: 'upcoming' | 'past' = 'upcoming';
  upcoming: Appointment[] = [];
  past: Appointment[] = [];

  constructor(
    public langService: LanguageService,
    public dataService: AppDataService,
    private alertCtrl: AlertController,
  ) {}

  ngOnInit(): void {
    this.dataService.appointments$.subscribe(() => this.refresh());
    this.refresh();
  }

  private refresh(): void {
    this.upcoming = this.dataService.getUpcomingAppointments();
    this.past = this.dataService.getPastAppointments();
  }

  get displayedAppointments(): Appointment[] {
    return this.activeTab === 'upcoming' ? this.upcoming : this.past;
  }

  statusClass(status: string): string {
    return `badge-${status}`;
  }

  statusLabel(status: string): string {
    return this.langService.t(`aptStatus_${status}`);
  }

  async cancelAppointment(apt: Appointment): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.langService.t('cancelAppointment'),
      message: `Cancel appointment with ${apt.doctorName} on ${apt.date}?`,
      buttons: [
        { text: this.langService.t('cancel'), role: 'cancel' },
        {
          text: this.langService.t('confirm'),
          role: 'destructive',
          handler: () => this.dataService.cancelAppointment(apt.id),
        },
      ],
    });
    await alert.present();
  }
}
