// iot/clearData.js
import { db } from "../firebaseConfig.js";
import { ref, remove } from "firebase/database";

// Hapus semua data pada node tertentu
export async function clearNode(path) {
  await remove(ref(db, path));
  console.log(`🧹 Cleared data at: ${path}`);
}

// Jalankan untuk hapus node tertentu
// clearNode("machines/machine_001/status");
// clearNode("alerts");
// clearNode("history");