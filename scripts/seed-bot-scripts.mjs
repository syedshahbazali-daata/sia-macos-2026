/**
 * Uploads all cloud bot scripts to Firestore.
 * Run with: node scripts/seed-bot-scripts.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, '../src/main/bots/cloud-scripts');

const PROJECT_ID = 'sia-testing-database';
const API_KEY   = 'AIzaSyC_Sp3J5envUXA28055Pny7RXUO93splJE';
const BASE_URL  = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const SCRIPTS = [
  { platform: 'tiktok-post',        version: 'v1', file: 'tiktok-post-v1.js' },
  { platform: 'instagram-post',     version: 'v1', file: 'instagram-post-v1.js' },
  { platform: 'facebook-post',      version: 'v1', file: 'instagram-post-v1.js' }, // same logic
  { platform: 'instagram-story',    version: 'v1', file: 'instagram-story-v1.js' },
  { platform: 'of-post',            version: 'v1', file: 'of-post-v1.js' },
  { platform: 'of-mass-messaging',  version: 'v1', file: 'of-mass-messaging-v1.js' },
];

async function upsertDoc(docPath, fields) {
  const url = `${BASE_URL}/${docPath}?key=${API_KEY}`;
  const body = JSON.stringify({ fields });
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore PATCH ${docPath} failed (${res.status}): ${err}`);
  }
  return res.json();
}

console.log('Seeding bot scripts to Firestore...\n');

for (const { platform, version, file } of SCRIPTS) {
  const script = readFileSync(join(SCRIPTS_DIR, file), 'utf-8');
  const docId  = `${platform}-${version}`;

  process.stdout.write(`  ${docId.padEnd(30)} `);
  await upsertDoc(`bot_scripts/${docId}`, {
    platform:  { stringValue: platform },
    version:   { stringValue: version },
    updatedAt: { stringValue: new Date().toISOString().slice(0, 10) },
    script:    { stringValue: script },
  });
  console.log(`✓  (${script.length} chars)`);
}

// Update manifest with all current versions
const manifestFields = {};
for (const { platform, version } of SCRIPTS) {
  manifestFields[platform] = { stringValue: version };
}
// keep twitter-post and youtube-shorts that were already seeded
manifestFields['twitter-post']   = { stringValue: 'v1' };
manifestFields['youtube-shorts'] = { stringValue: 'v1' };

process.stdout.write('  manifest'.padEnd(32));
await upsertDoc('bot_scripts/manifest', manifestFields);
console.log('✓');

console.log('\nDone. Firestore bot_scripts collection is up to date.');
