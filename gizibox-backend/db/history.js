// db/history.js
import { db } from "../firebaseConfig.js";
import { ref, push, get } from "firebase/database";

// Simpan data histori
export async function logHistory(machineId, data) {
  const historyRef = push(ref(db, "history/"));
  await historyRef.set({
    machineId,
    temperature: data.temperature,
    humidity: data.humidity,
    stock: data.stock,
    timestamp: new Date().toISOString(),
  });
  console.log(`🕒 History logged for ${machineId}`);
}

// Ambil histori berdasarkan ID mesin
export async function getHistory(machineId) {
  const snapshot = await get(ref(db, "history/"));
  if (!snapshot.exists()) return [];

  const allHistory = snapshot.val();
  return Object.values(allHistory).filter((h) => h.machineId === machineId);
}