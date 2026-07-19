import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBKgDaPcntG_EVWESjhUvzcvja3QWVX7mU",
  authDomain: "wohnung-7fe03.firebaseapp.com",
  projectId: "wohnung-7fe03",
  storageBucket: "wohnung-7fe03.firebasestorage.app",
  messagingSenderId: "961868714782",
  appId: "1:961868714782:web:aa2bf0ba5205729f672f0f",
  measurementId: "G-MTKBT245D8"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
