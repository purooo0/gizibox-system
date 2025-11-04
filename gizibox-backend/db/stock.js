// db/stock.js
import { db } from "../firebaseConfig.js";
import { ref, set, get, update } from "firebase/database";

/**
 * Set stok awal berdasarkan jumlah siswa aktif
 * Dipanggil dari dashboard oleh admin/sekolah
 */
export async function setInitialStock(machineId, studentCount) {
  try {
    const stockData = {
      initial_stock: studentCount,
      current_stock: studentCount,
      student_count: studentCount,
      last_refill: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    // Set stock_info (boleh pakai set karena node baru)
    await set(ref(db, `machines/${machineId}/stock_info`), stockData);
    
    // PENTING: Gunakan update() agar tidak menghapus temperature & humidity
    await update(ref(db, `machines/${machineId}/status`), {
      stock: studentCount,
      last_update: new Date().toISOString(),
    });

    console.log(`✅ Stok awal diset: ${studentCount} untuk ${machineId}`);
    return stockData;
  } catch (error) {
    console.error("❌ Gagal set stok awal:", error.message);
    throw error;
  }
}

/**
 * Update jumlah siswa aktif
 * Ketika ada perubahan data siswa di sekolah
 */
export async function updateStudentCount(machineId, newStudentCount) {
  try {
    const stockRef = ref(db, `machines/${machineId}/stock_info`);
    const snapshot = await get(stockRef);

    if (!snapshot.exists()) {
      throw new Error("Stock info tidak ditemukan. Set stok awal terlebih dahulu.");
    }

    await update(stockRef, {
      student_count: newStudentCount,
      last_updated: new Date().toISOString(),
    });

    console.log(`✅ Jumlah siswa diupdate: ${newStudentCount} untuk ${machineId}`);
    return { student_count: newStudentCount };
  } catch (error) {
    console.error("❌ Gagal update jumlah siswa:", error.message);
    throw error;
  }
}

/**
 * Refill stok (pengisian ulang MBG)
 * Ketika ada pengiriman MBG baru
 */
export async function refillStock(machineId, refillAmount) {
  try {
    const stockRef = ref(db, `machines/${machineId}/stock_info`);
    const snapshot = await get(stockRef);

    if (!snapshot.exists()) {
      throw new Error("Stock info tidak ditemukan. Set stok awal terlebih dahulu.");
    }

    const currentData = snapshot.val();
    const newStock = (currentData.current_stock || 0) + refillAmount;

    await update(stockRef, {
      current_stock: newStock,
      initial_stock: newStock, // Update initial stock juga
      last_refill: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    });

    // Update status stock
    await update(ref(db, `machines/${machineId}/status`), {
      stock: newStock,
      last_update: new Date().toISOString(),
    });

    console.log(`✅ Stok direfill: +${refillAmount} → Total: ${newStock} untuk ${machineId}`);
    
    // Log refill ke history
    await logRefillHistory(machineId, refillAmount, newStock);
    
    return { current_stock: newStock, refill_amount: refillAmount };
  } catch (error) {
    console.error("❌ Gagal refill stok:", error.message);
    throw error;
  }
}

/**
 * Kurangi stok (ketika siswa ambil MBG)
 * Dipanggil otomatis dari IoT hardware
 */
export async function decreaseStock(machineId, amount = 1) {
  try {
    const stockRef = ref(db, `machines/${machineId}/stock_info`);
    const snapshot = await get(stockRef);

    if (!snapshot.exists()) {
      throw new Error("Stock info tidak ditemukan.");
    }

    const currentData = snapshot.val();
    const newStock = Math.max(0, (currentData.current_stock || 0) - amount);

    await update(stockRef, {
      current_stock: newStock,
      last_updated: new Date().toISOString(),
    });

    // Update status stock
    await update(ref(db, `machines/${machineId}/status`), {
      stock: newStock,
      last_update: new Date().toISOString(),
    });

    console.log(`📉 Stok berkurang: -${amount} → Sisa: ${newStock} untuk ${machineId}`);
    return { current_stock: newStock };
  } catch (error) {
    console.error("❌ Gagal kurangi stok:", error.message);
    throw error;
  }
}

/**
 * Get informasi stok lengkap
 */
export async function getStockInfo(machineId) {
  try {
    const snapshot = await get(ref(db, `machines/${machineId}/stock_info`));
    
    if (!snapshot.exists()) {
      return null;
    }

    const stockInfo = snapshot.val();
    const usedStock = stockInfo.initial_stock - stockInfo.current_stock;
    const usagePercentage = ((usedStock / stockInfo.initial_stock) * 100).toFixed(2);

    return {
      ...stockInfo,
      used_stock: usedStock,
      usage_percentage: parseFloat(usagePercentage),
    };
  } catch (error) {
    console.error("❌ Gagal ambil stock info:", error.message);
    throw error;
  }
}

/**
 * Log history refill
 */
async function logRefillHistory(machineId, refillAmount, newTotal) {
  try {
    const { push } = await import("firebase/database");
    const historyRef = push(ref(db, "refill_history/"));
    
    await set(historyRef, {
      machineId,
      refill_amount: refillAmount,
      new_total: newTotal,
      timestamp: new Date().toISOString(),
      type: "refill",
    });

    console.log(`📝 Refill history logged for ${machineId}`);
  } catch (error) {
    console.error("⚠️ Gagal log refill history:", error.message);
  }
}

/**
 * Get statistik penggunaan stok
 */
export async function getStockStatistics(machineId) {
  try {
    const stockInfo = await getStockInfo(machineId);
    
    if (!stockInfo) {
      return null;
    }

    const daysActive = stockInfo.last_refill 
      ? Math.ceil((new Date() - new Date(stockInfo.last_refill)) / (1000 * 60 * 60 * 24))
      : 0;

    const avgDailyUsage = daysActive > 0 
      ? (stockInfo.used_stock / daysActive).toFixed(2)
      : 0;

    const estimatedDaysRemaining = avgDailyUsage > 0
      ? Math.ceil(stockInfo.current_stock / avgDailyUsage)
      : null;

    return {
      ...stockInfo,
      days_active: daysActive,
      avg_daily_usage: parseFloat(avgDailyUsage),
      estimated_days_remaining: estimatedDaysRemaining,
    };
  } catch (error) {
    console.error("❌ Gagal ambil statistik:", error.message);
    throw error;
  }
}
