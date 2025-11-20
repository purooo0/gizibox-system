import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

export function subscribeMachineStatus(machineId, callback) {
  const statusRef = ref(db, `machines/${machineId}/status`);
  return onValue(statusRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export function subscribeToHistory(machineId, callback) {
  const historyRef = ref(db, "history");

  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);

    const filtered = Object.values(data)
      .filter((entry) => entry.machineId === machineId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    callback(filtered);
  });
}
