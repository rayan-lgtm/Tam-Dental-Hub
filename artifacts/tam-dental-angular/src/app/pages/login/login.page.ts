import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { DEMO_OTP, AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

type Step = 'phone' | 'otp';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  @ViewChild('otpInput') otpInputEl!: ElementRef<HTMLInputElement>;

  step: Step = 'phone';
  phone = '';
  otp = '';
  sending = false;
  verifying = false;
  countdown = 0;
  private countdownInterval?: ReturnType<typeof setInterval>;

  readonly otpSlots = [0, 1, 2, 3, 4, 5];

  constructor(
    public langService: LanguageService,
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(loggedIn => {
      if (loggedIn) this.router.navigate(['/tabs/home'], { replaceUrl: true });
    });
  }

  get isPhoneValid(): boolean {
    return this.phone.length >= 9 && /^5/.test(this.phone);
  }

  onPhoneChange(value: string): void {
    this.phone = value.replace(/\D/g, '').slice(0, 10);
  }

  onOtpChange(value: string): void {
    this.otp = value.replace(/\D/g, '').slice(0, 6);
    if (this.otp.length === 6) {
      setTimeout(() => this.verifyOtp(), 200);
    }
  }

  focusOtpInput(): void {
    this.otpInputEl?.nativeElement?.focus();
  }

  async sendOtp(): Promise<void> {
    if (!this.isPhoneValid || this.sending) return;
    this.sending = true;
    await new Promise(r => setTimeout(r, 1400));
    this.sending = false;
    this.step = 'otp';
    this.otp = '';
    this.startCountdown();
    setTimeout(() => this.focusOtpInput(), 400);
  }

  async verifyOtp(): Promise<void> {
    if (this.otp.length < 6 || this.verifying) return;
    if (this.otp !== DEMO_OTP) {
      this.otp = '';
      const alert = await this.alertCtrl.create({
        header: this.langService.t('loginInvalidOtp'),
        message: this.langService.t('loginInvalidOtpMsg'),
        buttons: [this.langService.t('ok')],
      });
      await alert.present();
      setTimeout(() => this.focusOtpInput(), 300);
      return;
    }
    this.verifying = true;
    await new Promise(r => setTimeout(r, 900));
    await this.authService.login();
    this.verifying = false;
    this.router.navigate(['/tabs/home'], { replaceUrl: true });
  }

  resendOtp(): void {
    if (this.countdown > 0) return;
    this.otp = '';
    this.startCountdown();
    setTimeout(() => this.focusOtpInput(), 100);
  }

  goBack(): void {
    this.step = 'phone';
    this.otp = '';
    this.clearCountdown();
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdown = 60;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) this.clearCountdown();
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
    this.countdown = 0;
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
}
