import { getApp, getApps, initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function getReactNativePersistenceFactory():
  | ((storage: any) => any)
  | null {
  if (Platform.OS === 'web') return null;

  try {
    const mod = require('firebase/auth');
    if (typeof mod?.getReactNativePersistence === 'function') {
      return mod.getReactNativePersistence;
    }
  } catch (_) {}

  try {
    const mod = require('firebase/node_modules/@firebase/auth');
    if (typeof mod?.getReactNativePersistence === 'function') {
      return mod.getReactNativePersistence;
    }
  } catch (_) {}

  return null;
}

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  const persistenceFactory = getReactNativePersistenceFactory();
  if (persistenceFactory) {
    try {
      return initializeAuth(firebaseApp, {
        persistence: persistenceFactory(AsyncStorage),
      });
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (!msg.includes('already been initialized')) {
        console.warn('[firebase/config] Falha ao inicializar auth com persistencia:', msg);
      }
    }
  }

  return getAuth(firebaseApp);
}

const firebaseAuth = createAuth();
const firestore = getFirestore(firebaseApp);

export { firebaseApp, firebaseAuth, firestore };
