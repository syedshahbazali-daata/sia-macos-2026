import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyC_Sp3J5envUXA28055Pny7RXUO93splJE',
  authDomain: 'sia-testing-database.firebaseapp.com',
  databaseURL: 'https://sia-testing-database-default-rtdb.firebaseio.com',
  projectId: 'sia-testing-database',
  storageBucket: 'sia-testing-database.firebasestorage.app',
  messagingSenderId: '552552476958',
  appId: '1:552552476958:web:10907a5982ced18233990f'
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

