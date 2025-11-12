// auth/loginUser.js
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { db } from "../firebaseConfig.js";

const auth = getAuth();

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Ambil role user dari database
    const userRef = ref(db, "users/" + user.uid);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      const error = new Error("User tidak ditemukan di database!");
      error.code = "auth/user-not-found";
      throw error;
    }

    const userData = snapshot.val();
    
    if (!userData.role) {
      const error = new Error("Role user tidak valid");
      error.code = "auth/invalid-role";
      throw error;
    }

    console.log(`✅ Login sukses: ${user.email} (Role: ${userData.role})`);
    return { 
      uid: user.uid,
      email: user.email,
      role: userData.role,
      // Tambahkan field lain yang diperlukan
      ...userData
    };
  } catch (error) {
    console.error("❌ Gagal login:", error.message);
    throw error; // Re-throw error untuk ditangkap oleh route handler
  }
}

// Tes manual
// loginUser("sdn1@sch.id", "123456");
// loginUser("admin@gizi.go.id", "123456");