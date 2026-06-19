import { Timestamp } from 'firebase/firestore'

export type License = {
  id: string
  username: string
  expiry_date: Timestamp // Assuming Timestamp is a defined type
  email: string
  license: string
}
