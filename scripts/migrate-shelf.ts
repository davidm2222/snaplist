// F3 migration: add explicit shelf, canonical type, updatedAt. Leaves `tags` untouched.
// Usage: pnpm migrate:shelf            (dry run — prints changes, writes nothing)
//        pnpm migrate:shelf --apply    (writes; run pnpm backup first)
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './admin';
import { planShelfMigration } from '../src/lib/migrateNote';

async function main() {
  const apply = process.argv.includes('--apply');
  const snapshot = await db.collection('notes').get();

  const planned = snapshot.docs
    .map(doc => ({ doc, changes: planShelfMigration(doc.data() as Parameters<typeof planShelfMigration>[0]) }))
    .filter(p => Object.keys(p.changes).length > 0);

  // Show only the interesting changes; shelf copied as-is + updatedAt are summarized
  const fmt = (v: unknown) => (v === null ? '(removed)' : JSON.stringify(v));
  let routine = 0;
  for (const { doc, changes } of planned) {
    const data = doc.data();
    const interesting = changes.type !== undefined || changes.shelf !== data.tags?.[0];
    if (!interesting) { routine++; continue; }
    const parts = [`shelf ${fmt(data.tags?.[0])} → ${fmt(changes.shelf ?? data.shelf)}`];
    if (changes.type !== undefined) parts.push(`type ${fmt(data.type)} → ${fmt(changes.type)}`);
    console.log(`${String(data.title).slice(0, 40).padEnd(40)}  ${parts.join('   ')}`);
  }

  console.log(`\n${snapshot.size} notes · ${planned.length} to update · ${routine} routine (shelf copied from tags + updatedAt), ${planned.length - routine} shown above`);

  if (!apply) {
    console.log('Dry run — nothing written. Re-run with --apply to write.');
    return;
  }

  const writer = db.bulkWriter();
  for (const { doc, changes } of planned) {
    const update = Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [k, v === null ? FieldValue.delete() : v])
    );
    writer.update(doc.ref, update);
  }
  await writer.close();
  console.log(`Updated ${planned.length} notes.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
