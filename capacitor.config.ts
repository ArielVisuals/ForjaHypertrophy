import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forja.hypertrophy',
  appName: 'FORJA',
  webDir: 'dist/client', // usado solo para sync local; en producción carga desde server.url

  // ─── Live URL: carga la app de Vercel en el WebView nativo ──────────────────
  // Esto significa que cada deploy en Vercel actualiza la app automáticamente
  // sin necesidad de re-publicar en Google Play ni App Store.
  server: {
    url: 'https://forja-hypertrophy.vercel.app',
    cleartext: false, // solo HTTPS
  },

  // ─── Plugins ────────────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#0A0A0B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
    StatusBar: {
      style: 'Dark',          // texto blanco
      backgroundColor: '#0A0A0B',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  // ─── Android ─────────────────────────────────────────────────────────────────
  android: {
    minWebViewVersion: 60,
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // true solo en desarrollo
  },

  // ─── iOS ─────────────────────────────────────────────────────────────────────
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
