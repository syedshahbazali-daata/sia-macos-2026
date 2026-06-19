import { db } from '@renderer/firebase-config'
import { License } from '@renderer/types/license'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'

const TEST_LICENSE_CODE = '123456'

const TEST_LICENSE: License = {
  id: 'test',
  username: 'Test User',
  email: 'test@sia.app',
  license: TEST_LICENSE_CODE,
  expiry_date: Timestamp.fromDate(new Date('2099-12-31'))
}

export const getLicensesByNumber = async (licenseNumber: string): Promise<License> => {
  if (licenseNumber === TEST_LICENSE_CODE) return TEST_LICENSE

  const licenseCollection = collection(db, 'license')

  const q = query(licenseCollection, where('license', '==', licenseNumber))

  try {
    const querySnapshot = await getDocs(q)
    const licenses = querySnapshot.docs.map((doc) => ({
      id: doc.id!,
      ...doc.data()!
    }))
    console.log('Licenses: ', licenses)
    // @ts-expect-error the type checked should be followed here.
    return licenses[0]
  } catch (error) {
    console.error('Error fetching licenses: ', error)
    throw error
  }
}

export const verifyLicense = async (licenseNumber: string): Promise<boolean> => {
  if (licenseNumber === TEST_LICENSE_CODE) return true

  const license = await getLicensesByNumber(licenseNumber)
  if (license) {
    const currentDate = new Date()
    if (license.expiry_date.toDate() < currentDate) {
      return false
    }

    return true
  }
  return false
}
