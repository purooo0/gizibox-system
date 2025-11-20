// db/users.js
import admin from "firebase-admin";

// Ambil semua user
export async function getAllUsers() {
  const snapshot = await admin.database().ref("users").get();
  return snapshot.exists() ? snapshot.val() : {};
}

// Ambil 1 user
export async function getUserById(uid) {
  const snapshot = await admin.database().ref(`users/${uid}`).get();
  return snapshot.exists() ? snapshot.val() : null;
}

// Update user (role, machineId, dsb)
export async function updateUser(uid, newData) {
  await admin.database().ref(`users/${uid}`).update(newData);
  console.log(`✏️ Updated user ${uid}`);
}

// Hapus user (opsional, untuk admin)
export async function deleteUser(uid) {
  await admin.database().ref(`users/${uid}`).remove();
  console.log(`🗑️ Deleted user ${uid}`);
}

export async function findUserByEmail(email) {
  const usersSnap = await admin.database().ref("users").get();
  if (!usersSnap.exists()) return null;
  const users = usersSnap.val();
  for (const [uid, data] of Object.entries(users)) {
    if ((data.email || '').toLowerCase() === String(email || '').toLowerCase()) {
      return { uid, ...data };
    }
  }
  return null;
}

// Link a machine to the user's machineIds map
export async function addMachineToUser(uid, machineId) {
  await admin.database().ref(`users/${uid}/machineIds/${machineId}`).set(true);
}

// Unlink a machine from the user's machineIds map
export async function removeMachineFromUser(uid, machineId) {
  await admin.database().ref(`users/${uid}/machineIds/${machineId}`).remove();
}