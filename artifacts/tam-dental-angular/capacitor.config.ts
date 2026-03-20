import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sa.tamdental.patient',
  appName: 'TAM Dental',
  webDir: 'dist/tam-dental-angular',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Geolocation: {
      requestPermissions: true,
    },
    Preferences: {
      group: 'TAMDentalPrefs',
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
