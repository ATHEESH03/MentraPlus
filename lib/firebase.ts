// lib/firebase.ts — single init; client-safe.
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseConfigured = Boolean(
  cfg.apiKey && cfg.projectId && cfg.appId && cfg.apiKey !== ''
);

// Fallback dummy config so initializeApp doesn't crash during build-time SSR if env vars are unset
const activeConfig = firebaseConfigured
  ? cfg
  : {
      apiKey: 'demo-api-key',
      authDomain: 'demo-project.firebaseapp.com',
      projectId: 'demo-project',
      storageBucket: 'demo-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef',
    };

const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(activeConfig as any);
export const auth: Auth = getAuth(app);

// Use ignoreUndefinedProperties to prevent setDoc crashes on optional undefined fields
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
})();
