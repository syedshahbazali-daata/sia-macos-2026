/**
 * Seed script — creates sample license documents in Firestore.
 * Run once after creating the Firestore database in the Firebase Console:
 *
 *   node scripts/seed-licenses.cjs
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service-account key,
 * OR run with `firebase functions:shell` / `firebase emulators` context.
 *
 * Alternatively, paste each object below directly into the Firebase Console
 * under Firestore → license collection → Add document.
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : (() => { throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path') })()
  ),
  projectId: 'sia-testing-database',
})

const db = getFirestore()

const licenses = [
  {
    license: '123456',
    username: 'Test User',
    email: 'test@example.com',
    plan: 'pro',
    expiry_date: Timestamp.fromDate(new Date('2027-12-31')),
  },
  {
    license: '654321',
    username: 'Enterprise User',
    email: 'enterprise@example.com',
    plan: 'enterprise',
    expiry_date: Timestamp.fromDate(new Date('2027-12-31')),
  },
  {
    license: '000001',
    username: 'Free User',
    email: 'free@example.com',
    plan: 'free',
    expiry_date: Timestamp.fromDate(new Date('2027-12-31')),
  },
]

async function seed() {
  const col = db.collection('license')
  for (const lic of licenses) {
    await col.add(lic)
    console.log(`Added license: ${lic.license} (${lic.plan})`)
  }
  console.log('Seeding complete.')
}

seed().catch(console.error)
