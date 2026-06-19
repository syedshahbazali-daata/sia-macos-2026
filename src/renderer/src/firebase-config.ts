// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: 'AIzaSyAr-OWJ54_EFbLJT9TafFGBtTttB1G6EA8',
//   authDomain: 'siaapp-366e9.firebaseapp.com',
//   projectId: 'siaapp-366e9',
//   storageBucket: 'siaapp-366e9.appspot.com',
//   messagingSenderId: '444631903526',
//   appId: '1:444631903526:web:998b05091f7d736ceaa5e7'
// }
const firebaseConfig = {
  apiKey: "AIzaSyDH3Zw7WWAoiN0Iu4anOXPaLK2Y9imzqX0",
  authDomain: "siaproject-3079d.firebaseapp.com",
  databaseURL: "https://siaproject-3079d-default-rtdb.firebaseio.com",
  projectId: "siaproject-3079d",
  storageBucket: "siaproject-3079d.firebasestorage.app",
  messagingSenderId: "435645721915",
  appId: "1:435645721915:web:35ca23c8c21bed47939b1e"
}

// Initialize Firebase

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)



