import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

export const DEMO_OTP = '123456';
const AUTH_KEY = 'tam_dental_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor() {
    this.checkStoredAuth();
  }

  private async checkStoredAuth(): Promise<void> {
    const { value } = await Preferences.get({ key: AUTH_KEY });
    this.loggedIn.next(value === '1');
  }

  async login(): Promise<void> {
    await Preferences.set({ key: AUTH_KEY, value: '1' });
    this.loggedIn.next(true);
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: AUTH_KEY });
    this.loggedIn.next(false);
  }

  isAuthenticated(): boolean {
    return this.loggedIn.getValue();
  }
}
