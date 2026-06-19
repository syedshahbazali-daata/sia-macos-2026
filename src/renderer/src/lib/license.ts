import { db } from '@renderer/firebase-config'
import type { License } from '@renderer/types/license'
import { collection, getDocs, query, where } from 'firebase/firestore'

const LICENSE_CODE_REGEX = /^\d{6}$/

export async function getLicensesByNumber(licenseNumber: string): Promise<License | null> {
  if (!LICENSE_CODE_REGEX.test(licenseNumber)) {
    throw new Error('Invalid license code format')
  }

  const licenseCollection = collection(db, 'license')
  const q = query(licenseCollection, where('license', '==', licenseNumber))
  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) return null

  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as License
}

export async function verifyLicense(licenseNumber: string): Promise<boolean> {
  if (!LICENSE_CODE_REGEX.test(licenseNumber)) return false

  const license = await getLicensesByNumber(licenseNumber)
  if (!license) return false

  return license.expiry_date.toDate() >= new Date()
}
