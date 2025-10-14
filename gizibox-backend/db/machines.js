import { ref, set, get, update } from "firebase/database";
import { db } from "../firebaseConfig";

export async function updateMachineStatus(machineId, data) {
  await update(ref(db, `machines/${machineId}/status`), data);
}

export async function getMachineData(machineId) {
  const snapshot = await get(ref(db, `machines/${machineId}`));
  return snapshot.val();
}