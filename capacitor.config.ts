import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xpnslight.app',
  appName: 'XpnsLight',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
