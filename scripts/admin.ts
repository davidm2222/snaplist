// Shared Firebase Admin setup for local maintenance scripts.
// Admin access bypasses security rules — never import this from app code.
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Key lives outside the repo so it can't be committed. Override with SNAPLIST_SERVICE_ACCOUNT.
const keyPath =
  process.env.SNAPLIST_SERVICE_ACCOUNT ?? path.join(homedir(), '.secrets', 'snaplist-firebase-admin.json');

if (!existsSync(keyPath)) {
  console.error(`Service account key not found at ${keyPath}`);
  console.error('Firebase console → Project settings → Service accounts → Generate new private key');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
export const db = getFirestore();
