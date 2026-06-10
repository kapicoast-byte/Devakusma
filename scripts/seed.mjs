/**
 * Seed the Firestore database with the sample plants from the PRD.
 *
 * Usage:
 *   1. Download a service account key from Firebase Console →
 *      Project settings → Service accounts → Generate new private key.
 *   2. Save it as `serviceAccount.json` in the project root (git-ignored),
 *      or set GOOGLE_APPLICATION_CREDENTIALS to its path.
 *   3. Run: npm run seed
 */
import { readFileSync } from 'node:fs';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const entryId = (name, size) => `${norm(name)}__${norm(size)}`.replace(/[^a-z0-9_]+/g, '-');

const PLANTS = [
  { plantName: 'Areca Palm', size: '2 ft', quantity: 250, sellingPrice: 250, minThreshold: 20 },
  { plantName: 'Areca Palm', size: '3 ft', quantity: 80, sellingPrice: 500, minThreshold: 15 },
  { plantName: 'Areca Palm', size: '1 ft', quantity: 8, sellingPrice: 120, minThreshold: 20 },
  { plantName: 'Croton', size: '1 ft', quantity: 150, sellingPrice: 120, minThreshold: 25 },
  { plantName: 'Ficus', size: '2 ft', quantity: 60, sellingPrice: 350, minThreshold: 15 },
  { plantName: 'Thuja', size: '2 ft', quantity: 90, sellingPrice: 300, minThreshold: 20 },
  { plantName: 'Hibiscus', size: '1 ft', quantity: 120, sellingPrice: 90, minThreshold: 30 },
];

function loadCredential() {
  try {
    const json = JSON.parse(readFileSync(new URL('../serviceAccount.json', import.meta.url)));
    return cert(json);
  } catch {
    return applicationDefault();
  }
}

async function main() {
  initializeApp({ credential: loadCredential() });
  const db = getFirestore();
  const batch = db.batch();
  for (const p of PLANTS) {
    batch.set(db.collection('plants').doc(entryId(p.plantName, p.size)), {
      ...p,
      updatedAt: Date.now(),
    });
  }
  batch.set(db.collection('counters').doc('invoice'), { value: 0 }, { merge: true });
  await batch.commit();
  console.log(`Seeded ${PLANTS.length} plant entries.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
