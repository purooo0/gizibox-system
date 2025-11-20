// db/filterData.js
import admin from "firebase-admin";
import { getMachinesByOwner } from "./machines.js";

export async function getDataByRole(user) {
  try {
    if (user.role === "admin") {
      // Admin bisa lihat semua mesin (Admin SDK)
      const snapshot = await admin.database().ref("machines").get();
      console.log("📊 Admin melihat semua mesin");
      return snapshot.val();
    } else if (user.role === "school") {
      // Sekolah hanya bisa lihat SEMUA mesin miliknya
      if (!user.uid) throw new Error("User uid tidak tersedia");
      const machines = await getMachinesByOwner(user.uid);
      console.log(`🏫 Sekolah melihat semua mesin miliknya (owner_uid=${user.uid})`);
      return machines;
    } else {
      throw new Error("Role tidak dikenali!");
    }
  } catch (error) {
    console.error("❌ Gagal ambil data:", error.message);
  }
}