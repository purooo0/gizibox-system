// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHKjk7hi3czZs2odclSdctTLI-MnabANA",
  authDomain: "gizibox-7bbea.firebaseapp.com",
  databaseURL: "https://gizibox-7bbea-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gizibox-7bbea",
  storageBucket: "gizibox-7bbea.firebasestorage.app",
  messagingSenderId: "560037425199",
  appId: "1:560037425199:web:be7f47362482d74e2b56da",
  measurementId: "G-X9H911E616"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };