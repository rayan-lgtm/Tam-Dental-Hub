# Google Play Store – TAM Dental Submission Metadata

## App Identity
| Field | Value |
|---|---|
| App Name (EN) | TAM Dental – Patient App |
| App Name (AR) | تطبيق مريض تام لطب الأسنان |
| Package Name | `sa.tamdental.patient` |
| App Category | Health & Fitness |
| Content Rating | Everyone |
| Version | 1.0.0 (versionCode 1) |

---

## Short Description (EN – max 80 chars)
```
Book appointments, view invoices & manage your dental care – TAM Dental.
```

## Short Description (AR – max 80 chars)
```
احجز مواعيدك، اعرض فواتيرك وأدِر رعايتك في عيادات تام للأسنان.
```

---

## Full Description (EN – max 4,000 chars)
```
TAM Dental Patient App is your all-in-one digital companion for managing your dental
care at TAM Dental Clinics, Saudi Arabia.

FEATURES
──────────────────────────────────────────
• GPS Check-In – Confirm your arrival when you are within 500 m of the clinic.
• Appointments – View upcoming and past appointments; cancel if needed.
• Booking – Schedule new appointments directly from the app.
• Invoices & Payments – View itemised bills and pay securely online.
• Prescriptions – Access signed digital prescriptions from your dentist.
• Questionnaires & Consents – Fill out pre-visit forms and consent documents.
• Clinic Contact – Call or WhatsApp the clinic with one tap.
• Document Requests – Request sick-leave certificates, reports, and X-rays.
• Family Members – Add and manage dental care for family members.
• Full Arabic & English support with complete RTL layout.

SECURITY
──────────────────────────────────────────
• Phone-number OTP login – no passwords to remember.
• Your data is stored securely on TAM Dental servers.
• No data is sold to third parties.

ABOUT TAM DENTAL
──────────────────────────────────────────
TAM Dental Clinics (عيادات تام للأسنان) is a leading dental care provider in Saudi Arabia
offering comprehensive general and specialist dental services.
```

---

## Full Description (AR – max 4,000 chars)
```
تطبيق مريض عيادات تام للأسنان هو رفيقك الرقمي الشامل لإدارة رعايتك في عيادات تام للأسنان بالمملكة العربية السعودية.

المميزات
──────────────────────────────────────────
• تسجيل الوصول بـ GPS – أكّد وصولك عند اقترابك من العيادة بمسافة 500 متر.
• المواعيد – اعرض المواعيد القادمة والسابقة وألغِ إن لزم الأمر.
• الحجز – احجز مواعيد جديدة مباشرةً من التطبيق.
• الفواتير والمدفوعات – اعرض الفواتير المفصّلة وادفع بأمان عبر الإنترنت.
• الوصفات الطبية – اطّلع على الوصفات الرقمية الموقّعة من طبيبك.
• الاستبيانات والموافقات – أكمِل نماذج ما قبل الزيارة ووثائق الموافقة.
• التواصل مع العيادة – اتصل أو راسل العيادة عبر واتساب بنقرة واحدة.
• طلبات الوثائق – اطلب إجازات مرضية، تقارير، وأشعة.
• أفراد الأسرة – أضِف أفراد أسرتك وأدِر رعايتهم الصحية.
• دعم كامل للغتين العربية والإنجليزية مع تخطيط RTL.
```

---

## Store Listing Assets Required
| Asset | Size / Format | Notes |
|---|---|---|
| Icon | 512×512 PNG | No alpha; brand blue background |
| Feature Graphic | 1024×500 PNG/JPEG | Used at top of Play Store listing |
| Phone Screenshots | 2-8 screenshots | min 320px wide, max 3840px |
| Tablet Screenshots | Optional | 7-inch and 10-inch |
| Privacy Policy URL | HTTPS URL | Required for health apps |

---

## Build & Release Steps
```bash
# 1. Build the Angular app
ng build --configuration production

# 2. Sync Capacitor (copies web assets to android/)
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
#    Build → Generate Signed Bundle/APK
#    Choose "Android App Bundle (.aab)"  ← recommended for Play Store
#    Use your release keystore

# 5. Upload the .aab to Google Play Console
#    → Production track for live release
#    → Internal / Alpha / Beta for testing
```

---

## Keystore Generation (first time)
```bash
keytool -genkey -v \
  -keystore tam-dental-release.keystore \
  -alias tam-dental \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass  YOUR_KEY_PASSWORD \
  -dname "CN=TAM Dental, OU=Mobile, O=TAM Dental Clinics, L=Riyadh, ST=Riyadh, C=SA"
```

**Store the keystore and passwords securely. Losing them means you cannot update the app.**

---

## Google Play Console Checklist
- [ ] App created in Play Console with package `sa.tamdental.patient`
- [ ] Content rating questionnaire completed (Health category)
- [ ] Privacy policy URL added
- [ ] Target audience set to 18+
- [ ] Declaration: no children's content
- [ ] Saudi Arabia (SA) distribution selected
- [ ] Permissions justification provided for: LOCATION, CAMERA, CALL_PHONE
- [ ] Data safety section filled (OTP phone number collected, encrypted)
- [ ] AAB uploaded to Internal Testing track
- [ ] At least 1 tester approved before Production release
