import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Language } from '../models';

const LANG_KEY = 'tam_dental_language';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    back: 'Back', cancel: 'Cancel', confirm: 'Confirm', save: 'Save',
    loading: 'Loading...', ok: 'OK', done: 'Done', next: 'Next',
    yes: 'Yes', no: 'No',
    tabHome: 'Home', tabAppointments: 'Appointments', tabHealth: 'Health',
    tabBilling: 'Billing', tabProfile: 'Profile',
    goodMorning: 'Good morning,', goodAfternoon: 'Good afternoon,', goodEvening: 'Good evening,',
    nextAppointment: 'Next Appointment', quickActions: 'Quick Actions',
    checkIn: 'Check In', checkedIn: 'Checked In',
    book: 'Book', payBill: 'Pay Bill', callClinic: 'Call Clinic',
    whatsAppChat: 'WhatsApp', requestDoc: 'Request Doc',
    appointments: 'Appointments', upcoming: 'Upcoming', past: 'Past',
    noUpcomingApts: 'No upcoming appointments', noPastApts: 'No past appointments',
    bookAppointment: 'Book Appointment',
    aptStatus_upcoming: 'Upcoming', aptStatus_completed: 'Completed', aptStatus_cancelled: 'Cancelled',
    health: 'Health', medicalHistory: 'Medical History',
    allergies: 'Allergies', questionnaires: 'Questionnaires & Consents',
    billing: 'Billing', invoices: 'Invoices', unpaid: 'Unpaid', paid: 'Paid', partial: 'Partial',
    totalDue: 'Total Due', viewInvoice: 'View Invoice', payNow: 'Pay Now',
    profile: 'Profile', myRecords: 'My Records', services: 'Services', support: 'Support',
    familyMembers: 'Family Members', addFamilyMember: 'Add Family Member',
    noFamilyMembers: 'No family members added yet',
    language: 'Language', switchToArabic: 'العربية', switchToEnglish: 'English',
    signOut: 'Sign Out', signOutConfirm: 'Sign Out?',
    signOutMsg: 'Are you sure you want to sign out of your account?',
    appVersion: 'TAM Dental v1.0',
    loginWelcome: 'Welcome Back', loginSubtitle: 'Your Digital Dental Portal',
    loginSignIn: 'Sign In',
    loginPhonePrompt: 'Enter your mobile number to receive a verification code.',
    loginPhone: 'Mobile Number', loginPhonePlaceholder: '5XXXXXXXX',
    loginSendOtp: 'Send Verification Code', loginSendingOtp: 'Sending...',
    loginOtpLabel: 'Verify Your Number',
    loginVerify: 'Verify & Sign In', loginVerifying: 'Verifying...',
    loginResend: 'Resend Code',
    loginInvalidPhone: 'Invalid Number',
    loginInvalidPhoneMsg: 'Please enter a valid Saudi mobile number starting with 5.',
    loginInvalidOtp: 'Incorrect Code',
    loginInvalidOtpMsg: 'The code you entered is incorrect. For demo, use 123456.',
    loginDemoNote: 'Demo mode: any phone starting with 5 works. OTP is 123456.',
    speakToTeam: 'Speak to our team',
    messageInstantly: 'Message us instantly',
    sickLeaveReports: 'Sick leave, reports, X-rays...',
    submitRequest: 'Submit Request',
    doctorPrescriptions: 'Doctor-signed prescriptions',
    formsSignatures: 'Questionnaires & signatures',
    manageVisits: 'Manage upcoming visits',
    viewPayBills: 'View and pay your bills',
  },
  ar: {
    back: 'رجوع', cancel: 'إلغاء', confirm: 'تأكيد', save: 'حفظ',
    loading: 'جارٍ التحميل...', ok: 'موافق', done: 'تم', next: 'التالي',
    yes: 'نعم', no: 'لا',
    tabHome: 'الرئيسية', tabAppointments: 'المواعيد', tabHealth: 'الصحة',
    tabBilling: 'الفواتير', tabProfile: 'الملف الشخصي',
    goodMorning: 'صباح الخير،', goodAfternoon: 'مساء الخير،', goodEvening: 'مساء الخير،',
    nextAppointment: 'الموعد القادم', quickActions: 'إجراءات سريعة',
    checkIn: 'تسجيل الوصول', checkedIn: 'تم التسجيل',
    book: 'حجز', payBill: 'دفع الفاتورة', callClinic: 'اتصل بالعيادة',
    whatsAppChat: 'واتساب', requestDoc: 'طلب وثيقة',
    appointments: 'المواعيد', upcoming: 'القادمة', past: 'السابقة',
    noUpcomingApts: 'لا توجد مواعيد قادمة', noPastApts: 'لا توجد مواعيد سابقة',
    bookAppointment: 'احجز موعداً',
    aptStatus_upcoming: 'قادم', aptStatus_completed: 'مكتمل', aptStatus_cancelled: 'ملغى',
    health: 'الصحة', medicalHistory: 'التاريخ الطبي',
    allergies: 'الحساسية', questionnaires: 'الاستبيانات والموافقات',
    billing: 'الفواتير', invoices: 'الفواتير', unpaid: 'غير مدفوعة', paid: 'مدفوعة', partial: 'جزئي',
    totalDue: 'المبلغ المستحق', viewInvoice: 'عرض الفاتورة', payNow: 'ادفع الآن',
    profile: 'الملف الشخصي', myRecords: 'سجلاتي', services: 'الخدمات', support: 'الدعم',
    familyMembers: 'أفراد الأسرة', addFamilyMember: 'إضافة فرد من الأسرة',
    noFamilyMembers: 'لم يتم إضافة أفراد أسرة بعد',
    language: 'اللغة', switchToArabic: 'العربية', switchToEnglish: 'English',
    signOut: 'تسجيل الخروج', signOutConfirm: 'تسجيل الخروج؟',
    signOutMsg: 'هل تريد تسجيل الخروج من حسابك؟',
    appVersion: 'تطبيق تام لطب الأسنان v1.0',
    loginWelcome: 'مرحباً بك', loginSubtitle: 'بوابتك الرقمية لطب الأسنان',
    loginSignIn: 'تسجيل الدخول',
    loginPhonePrompt: 'أدخل رقم جوالك لاستلام رمز التحقق.',
    loginPhone: 'رقم الجوال', loginPhonePlaceholder: '5XXXXXXXX',
    loginSendOtp: 'إرسال رمز التحقق', loginSendingOtp: 'جارٍ الإرسال...',
    loginOtpLabel: 'تأكيد رقم الجوال',
    loginVerify: 'تحقق وسجّل الدخول', loginVerifying: 'جارٍ التحقق...',
    loginResend: 'إعادة إرسال الرمز',
    loginInvalidPhone: 'رقم غير صحيح',
    loginInvalidPhoneMsg: 'يرجى إدخال رقم جوال سعودي صحيح يبدأ بالرقم 5.',
    loginInvalidOtp: 'رمز غير صحيح',
    loginInvalidOtpMsg: 'الرمز المُدخَل غير صحيح. في وضع التجربة، استخدم 123456.',
    loginDemoNote: 'وضع تجريبي: أي رقم يبدأ بـ 5 صالح. رمز التحقق هو 123456.',
    speakToTeam: 'تحدث مع فريقنا',
    messageInstantly: 'راسلنا فوراً',
    sickLeaveReports: 'إجازة مرضية، تقارير، أشعة...',
    submitRequest: 'تقديم طلب',
    doctorPrescriptions: 'وصفات طبية موقّعة من الطبيب',
    formsSignatures: 'الاستبيانات والتوقيعات',
    manageVisits: 'إدارة الزيارات القادمة',
    viewPayBills: 'عرض الفواتير وسدادها',
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private langSubject = new BehaviorSubject<Language>('en');
  language$ = this.langSubject.asObservable();

  get language(): Language { return this.langSubject.getValue(); }
  get isRTL(): boolean { return this.language === 'ar'; }
  get dir(): 'rtl' | 'ltr' { return this.isRTL ? 'rtl' : 'ltr'; }

  constructor() { this.loadLanguage(); }

  private async loadLanguage(): Promise<void> {
    const { value } = await Preferences.get({ key: LANG_KEY });
    if (value === 'en' || value === 'ar') {
      this.applyLanguage(value as Language, false);
    }
  }

  async setLanguage(lang: Language): Promise<void> {
    this.applyLanguage(lang, true);
  }

  toggleLanguage(): void {
    this.setLanguage(this.language === 'en' ? 'ar' : 'en');
  }

  private applyLanguage(lang: Language, save: boolean): void {
    this.langSubject.next(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (save) {
      Preferences.set({ key: LANG_KEY, value: lang });
    }
  }

  t(key: string): string {
    return TRANSLATIONS[this.language][key] ?? TRANSLATIONS['en'][key] ?? key;
  }
}
