import { ref, set } from "firebase/database";
import { db } from "../firebaseConfig.js";

const machineId = "machine_001";

function sendDummyData() {
  const data = {
    temperature: 30 + Math.random() * 5,
    humidity: 50 + Math.random() * 10,
    stock: 10 - Math.floor(Math.random() * 3),
    last_update: new Date().toISOString(),
  };

  set(ref(db, `machines/${machineId}/status`), data)
    .then(() => console.log("📡 Data terkirim:", data))
    .catch((err) => console.error("❌ Gagal:", err));
}

setInterval(sendDummyData, 5000);