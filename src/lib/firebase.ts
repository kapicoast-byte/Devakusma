import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth';

/**
 * Firebase initialisation with OFFLINE-FIRST persistence.
 *
 * Config is read from Vite env vars (see .env.example). Persistent local cache
 * (IndexedDB) lets every core feature work without internet; Firestore syncs and
 * backs up automatically when a connection returns.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId);

let app: FirebaseApp | undefined;
let dbInstance: Firestore | undefined;
let authInstance: Auth | undefined;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    // Drop undefined fields (e.g. an empty optional mobile) instead of erroring.
    ignoreUndefinedProperties: true,
  });
  authInstance = getAuth(app);
} else {
  // Helpful during local setup before a Firebase project is wired up.
  console.warn(
    '[Devakusuma] Firebase is not configured. Copy .env.example to .env and add your Firebase keys.',
  );
}

export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;

/** Google sign-in. Requires the Google provider enabled in Firebase Auth. */
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
