// db/dashboard.js
import { db } from "../firebaseConfig.js";
import { ref, get, update } from "firebase/database";
import { setInitialStock, updateStudentCount, refillStock, getStockInfo, getStockStatistics } from "./stock.js";

/**
 * Dashboard: Set stok awal untuk sekolah
 * Dipanggil ketika admin/sekolah input jumlah siswa aktif
 */
export async function initializeSchoolStock(machineId, studentCount, schoolInfo = {}) {
  try {
    // Set stok awal
    const stockData = await setInitialStock(machineId, studentCount);

    // PENTING: Update langsung ke node school_info, bukan parent node
    // Agar tidak menimpa node status yang sudah ada (temperature, humidity)
    await update(ref(db, `machines/${machineId}/school_info`), {
      student_count: studentCount,
      school_name: schoolInfo.school_name || null,
      school_id: schoolInfo.school_id || null,
      last_updated: new Date().toISOString(),
    });

    console.log(`✅ Sekolah ${machineId} diinisialisasi dengan ${studentCount} siswa`);
    
    return {
      success: true,
      machineId,
      studentCount,
      stockData,
    };
  } catch (error) {
    console.error("❌ Gagal inisialisasi sekolah:", error.message);
    throw error;
  }
}

/**
 * Dashboard: Update jumlah siswa aktif
 */
export async function updateSchoolStudentCount(machineId, newStudentCount) {
  try {
    await updateStudentCount(machineId, newStudentCount);
    
    await update(ref(db, `machines/${machineId}/school_info`), {
      student_count: newStudentCount,
      last_updated: new Date().toISOString(),
    });

    console.log(`✅ Jumlah siswa ${machineId} diupdate menjadi ${newStudentCount}`);
    
    return {
      success: true,
      machineId,
      newStudentCount,
    };
  } catch (error) {
    console.error("❌ Gagal update jumlah siswa:", error.message);
    throw error;
  }
}

/**
 * Dashboard: Refill stok MBG
 */
export async function refillMBGStock(machineId, refillAmount, notes = "") {
  try {
    const result = await refillStock(machineId, refillAmount);

    // Log refill dengan notes
    await update(ref(db, `machines/${machineId}/school_info`), {
      last_refill: new Date().toISOString(),
      last_refill_amount: refillAmount,
      refill_notes: notes,
    });

    console.log(`✅ Refill ${refillAmount} MBG untuk ${machineId}`);
    
    return {
      success: true,
      machineId,
      refillAmount,
      newTotal: result.current_stock,
    };
  } catch (error) {
    console.error("❌ Gagal refill stok:", error.message);
    throw error;
  }
}

/**
 * Dashboard: Get overview semua mesin (untuk admin)
 */
export async function getAllMachinesOverview() {
  try {
    const snapshot = await get(ref(db, "machines"));
    
    if (!snapshot.exists()) {
      return [];
    }

    const machines = snapshot.val();
    const overview = [];

    for (const [machineId, machineData] of Object.entries(machines)) {
      const stockInfo = await getStockInfo(machineId);
      const stockStats = await getStockStatistics(machineId);

      overview.push({
        machineId,
        status: machineData.status || {},
        school_info: machineData.school_info || {},
        stock_info: stockInfo,
        stock_statistics: stockStats,
      });
    }

    return overview;
  } catch (error) {
    console.error("❌ Gagal ambil overview:", error.message);
    throw error;
  }
}

/**
 * Dashboard: Get detail satu mesin (untuk sekolah)
 */
export async function getMachineDetail(machineId) {
  try {
    const snapshot = await get(ref(db, `machines/${machineId}`));
    
    if (!snapshot.exists()) {
      throw new Error(`Machine ${machineId} tidak ditemukan`);
    }

    const machineData = snapshot.val();
    const stockInfo = await getStockInfo(machineId);
    const stockStats = await getStockStatistics(machineId);

    return {
      machineId,
      status: machineData.status || {},
      school_info: machineData.school_info || {},
      stock_info: stockInfo,
      stock_statistics: stockStats,
    };
  } catch (error) {
    console.error("❌ Gagal ambil detail mesin:", error.message);
    throw error;
  }
}

/**
 * Dashboard: Get alerts untuk mesin tertentu
 */
export async function getMachineAlerts(machineId, limit = 10) {
  try {
    const snapshot = await get(ref(db, "alerts"));
    
    if (!snapshot.exists()) {
      return [];
    }

    const allAlerts = snapshot.val();
    const machineAlerts = Object.entries(allAlerts)
      .filter(([_, alert]) => alert.machineId === machineId)
      .map(([id, alert]) => ({ id, ...alert }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return machineAlerts;
  } catch (error) {
    console.error("❌ Gagal ambil alerts:", error.message);
    throw error;
  }
}

/**
 * Dashboard: Get refill history
 */
export async function getRefillHistory(machineId, limit = 10) {
  try {
    const snapshot = await get(ref(db, "refill_history"));
    
    if (!snapshot.exists()) {
      return [];
    }

    const allHistory = snapshot.val();
    const refillHistory = Object.entries(allHistory)
      .filter(([_, record]) => record.machineId === machineId)
      .map(([id, record]) => ({ id, ...record }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return refillHistory;
  } catch (error) {
    console.error("❌ Gagal ambil refill history:", error.message);
    throw error;
  }
}
