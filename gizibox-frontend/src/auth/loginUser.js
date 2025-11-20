// src/auth/loginUser.js
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { db } from "../firebaseConfig.js";

const auth = getAuth();

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Ambil data user dari database
    const userRef = ref(db, "users/" + user.uid);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      console.error("❌ User tidak ditemukan di database!");
      return null;
    }

    const userData = snapshot.val();
    console.log(`✅ Login sukses: ${user.email} (Role: ${userData.role})`);

    return { ...userData, uid: user.uid };
  } catch (error) {
    console.error("❌ Gagal login:", error.message);
    return null;
  }
}
