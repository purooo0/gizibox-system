import { loginUser } from "./loginUser.js";
import { ref, get } from "firebase/database";
import { db } from "../firebaseConfig.js";

async function loginAndGetData() {
  const email = "sdn1@sch.id";
  const password = "123456";

  const profile = await loginUser(email, password);
  console.log("✅ Login berhasil:", profile.email);

  const userNode = ref(db, "users/" + profile.uid);
  const snapshot = await get(userNode);
  const userData = snapshot.val();

  console.log("📁 Data profil:", userData);
}

loginAndGetData();