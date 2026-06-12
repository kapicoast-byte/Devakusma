import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Lazy server-side Firestore (firebase-admin). Reads the service-account JSON
 * from the FIREBASE_SERVICE_ACCOUNT env var. Returns null when not configured
 * so the bot can still answer /ping and /help.
 */
let app: App | undefined;

export function getDb(): Firestore | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  if (!app) {
    const creds = JSON.parse(raw);
    app = getApps()[0] ?? initializeApp({ credential: cert(creds) });
  }
  return getFirestore(app);
}
