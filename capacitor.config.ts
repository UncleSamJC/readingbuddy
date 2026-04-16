import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.readwithroz.app',
  appName: 'Read with Roz',
  webDir: 'apps/web/out',
  server: {
    url: 'https://readingbuddy-web.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
  },
  plugins: {
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
