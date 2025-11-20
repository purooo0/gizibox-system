import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAHKjk7hi3czZs2odclSdctTLI-MnabANA",
  authDomain: "gizibox-7bbea.firebaseapp.com",
  databaseURL: "https://gizibox-7bbea-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gizibox-7bbea",
  storageBucket: "gizibox-7bbea.appspot.com",
  messagingSenderId: "560037425199",
  appId: "1:560037425199:web:be7f47362482d74e2b56da",
  measurementId: "G-X9H911E616"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
