import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { AppDataService } from '../../services/app-data.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  constructor(
    public langService: LanguageService,
    public dataService: AppDataService,
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
  ) {}

  get patientName(): string {
    return this.langService.language === 'ar'
      ? this.dataService.patient.nameAr
      : this.dataService.patient.name;
  }

  get patientInitials(): string {
    return this.dataService.patient.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('');
  }

  get pendingForms(): number {
    return this.dataService.getPendingQuestionnaires().length;
  }

  get unpaidInvoices(): number {
    return this.dataService.getUnpaidInvoices().length;
  }

  callClinic(): void {
    window.location.href = 'tel:+966XXXXXXXXX';
  }

  openWhatsApp(): void {
    window.open('https://wa.me/966XXXXXXXXX', '_blank');
  }

  async signOut(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.langService.t('signOutConfirm'),
      message: this.langService.t('signOutMsg'),
      buttons: [
        { text: this.langService.t('cancel'), role: 'cancel' },
        {
          text: this.langService.t('signOut'),
          role: 'destructive',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          },
        },
      ],
    });
    await alert.present();
  }

  toggleLanguage(): void {
    this.langService.toggleLanguage();
  }
}
