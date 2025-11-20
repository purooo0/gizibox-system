// db/history.js
import admin from "firebase-admin";

// Simpan data histori
export async function logHistory(machineId, data) {
  const historyRef = admin.database().ref("history").push();
  const entry = {
    machineId,
    timestamp: new Date().toISOString(),
  };
  if (typeof data.temperature === "number") entry.temperature = data.temperature;
  if (typeof data.humidity === "number") entry.humidity = data.humidity;
  if (typeof data.stock === "number") entry.stock = data.stock;
  await historyRef.set(entry);
  console.log(`🕒 History logged for ${machineId}`);
}

// Ambil histori berdasarkan ID mesin
export async function getHistory(machineId) {
  const snapshot = await admin.database().ref("history").get();
  if (!snapshot.exists()) return [];
  const allHistory = snapshot.val();
  return Object.values(allHistory).filter((h) => h.machineId === machineId);
}