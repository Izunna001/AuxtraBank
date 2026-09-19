import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAAZqaQGZwV-Ly4RTq2JSe3ZN2Oa0rCUfo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'westbridge-bank.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'westbridge-bank',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'westbridge-bank.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1051162279453',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1051162279453:web:e6a123109c69cd717e90f4',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DC60LM4095',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
