// monitoring/autoAlert.js
import { db } from "../firebaseConfig.js";
import { ref, onValue, set, push } from "firebase/database";

// Threshold batas aman
const MAX_TEMP = 35;
const MIN_TEMP = 15;
const MIN_STOCK = 3;

const machineRef = ref(db, "machines/");

onValue(machineRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach(async (machineId) => {
    const status = data[machineId].status;

    if (!status) return;

    const { temperature, humidity, stock } = status;
    const now = new Date().toISOString();

    // Cek kondisi abnormal
    let alertMessage = null;

    if (temperature > MAX_TEMP) {
      alertMessage = `🔥 Suhu tinggi (${temperature}°C) pada ${machineId}`;
    } else if (temperature < MIN_TEMP) {
      alertMessage = `❄️ Suhu terlalu rendah (${temperature}°C) pada ${machineId}`;
    } else if (stock <= MIN_STOCK) {
      alertMessage = `⚠️ Stok menipis (${stock} item) pada ${machineId}`;
    }

    // Kalau ada alert, tulis ke Firebase
    if (alertMessage) {
      const alertRef = push(ref(db, "alerts/"));
      await set(alertRef, {
        machineId,
        message: alertMessage,
        timestamp: now,
      });

      console.log("🚨 ALERT:", alertMessage);
    }

    // Simpan log history setiap kali update
    const historyRef = push(ref(db, "history/"));
    await set(historyRef, {
      machineId,
      temperature,
      humidity,
      stock,
      timestamp: now,
    });

    console.log(`🕒 History updated for ${machineId}`);
  });
});