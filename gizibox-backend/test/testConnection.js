import { db } from "../firebaseConfig.js";
import { ref, set, get } from "firebase/database";

async function testConnection() {
  const path = "machines/test_machine/status";
  const testData = {
    temperature: 28.5,
    humidity: 60,
    stock: 10,
    last_update: new Date().toISOString(),
  };

  await set(ref(db, path), testData);
  console.log("✅ Data berhasil dikirim ke Firebase!");

  const snapshot = await get(ref(db, path));
  console.log("📥 Data dari Firebase:", snapshot.val());
}

testConnection();