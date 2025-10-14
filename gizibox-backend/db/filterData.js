// db/filterData.js
import { db } from "../firebaseConfig.js";
import { ref, get } from "firebase/database";

export async function getDataByRole(user) {
  try {
    if (user.role === "admin") {
      // Admin bisa lihat semua mesin
      const snapshot = await get(ref(db, "machines"));
      console.log("📊 Admin melihat semua mesin");
      return snapshot.val();
    } else if (user.role === "school") {
      // Sekolah hanya bisa lihat mesin miliknya
      const snapshot = await get(ref(db, `machines/${user.machineId}`));
      console.log(`🏫 Sekolah melihat mesin ${user.machineId}`);
      return snapshot.val();
    } else {
      throw new Error("Role tidak dikenali!");
    }
  } catch (error) {
    console.error("❌ Gagal ambil data:", error.message);
  }
}