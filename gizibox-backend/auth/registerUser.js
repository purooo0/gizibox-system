// auth/registerUser.js
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { db } from "../firebaseConfig.js";

const auth = getAuth();

async function registerUser(email, password, role = "school") {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Simpan info user di database
    await set(ref(db, "users/" + user.uid), {
      email: user.email,
      role: role,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ User registered successfully: ${user.email}`);
    return user;
  } catch (error) {
    console.error("❌ Error registering user:", error.message);
  }
}

// TEST FUNCTION
registerUser("sdn1@sch.id", "123456", "school");