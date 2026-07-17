import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arqlift.workouttracker',
  appName: 'ArqLift',
  webDir: 'dist',
  server: {
    // Serve over https://localhost on Android so the auth refresh cookie's
    // `secure: true` flag (backend/src/routes/auth.ts) isn't silently dropped.
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#030b14',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0891b2',
    },
  },
};

export default config;
