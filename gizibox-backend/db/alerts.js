import { ref, update } from "firebase/database";
import { db } from "../firebaseConfig";

export async function updateAlerts(machineId, temperature, stock) {
  const alerts = {
    temperature_high: temperature > 38,
    stock_low: stock < 3,
  };
  await update(ref(db, `machines/${machineId}/alerts`), alerts);
}