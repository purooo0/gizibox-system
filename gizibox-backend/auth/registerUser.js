// auth/registerUser.js
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { db } from "../firebaseConfig.js";

const auth = getAuth();

export async function registerUser(email, password, role = "school") {
  try {
    // Coba daftarkan user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Simpan info user di database
    await set(ref(db, "users/" + user.uid), {
      email: user.email,
      role: role,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ User registered successfully: ${user.email}`);
    return { 
      uid: user.uid, 
      email: user.email, 
      role,
      isNewUser: true
    };
  } catch (error) {
    // Jika email sudah terdaftar, cek apakah sudah ada di database
    if (error.code === 'auth/email-already-in-use') {
      console.log(`ℹ️ User dengan email ${email} sudah terdaftar. Mencoba login...`);
      
      // Coba login untuk mendapatkan UID-nya
      try {
        const loginCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = loginCredential.user;
        
        // Cek apakah user sudah ada di database
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          console.log(`✅ User ${email} berhasil login`);
          return { 
            ...snapshot.val(),
            uid: user.uid,
            isNewUser: false
          };
        } else {
          // Jika user ada di Auth tapi tidak ada di database
          throw new Error('User tidak terdaftar di database');
        }
      } catch (loginError) {
        console.error('❌ Gagal login:', loginError.message);
        throw new Error('Email sudah digunakan');
      }
    }
    
    console.error("❌ Error:", error.message);
    throw error;
  }
}

// Hapus atau comment test function jika tidak diperlukan
// registerUser("sdn5@sch.id", "123456", "school");