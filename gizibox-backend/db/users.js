// db/users.js
import { db } from "../firebaseConfig.js";
import { ref, get, update, remove } from "firebase/database";

// Ambil semua user
export async function getAllUsers() {
  const snapshot = await get(ref(db, "users"));
  return snapshot.exists() ? snapshot.val() : {};
}

// Ambil 1 user
export async function getUserById(uid) {
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
}

// Update user (role, machineId, dsb)
export async function updateUser(uid, newData) {
  await update(ref(db, `users/${uid}`), newData);
  console.log(`✏️ Updated user ${uid}`);
}

// Hapus user (opsional, untuk admin)
export async function deleteUser(uid) {
  await remove(ref(db, `users/${uid}`));
  console.log(`🗑️ Deleted user ${uid}`);
}