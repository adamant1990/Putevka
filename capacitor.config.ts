import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.putevka.calculator',
  appName: 'Путёвка',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#f4f6f8'
  }
};

export default config;
