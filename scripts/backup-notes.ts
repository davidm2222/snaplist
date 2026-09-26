// Export every note to backups/notes-<timestamp>.json (gitignored).
// Usage: pnpm backup
import { mkdirSync, writeFileSync } from 'node:fs';
import { db } from './admin';

async function main() {
  const snapshot = await db.collection('notes').get();
  const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  mkdirSync('backups', { recursive: true });
  const file = `backups/notes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(file, JSON.stringify(notes, null, 2));
  console.log(`Backed up ${notes.length} notes → ${file}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
