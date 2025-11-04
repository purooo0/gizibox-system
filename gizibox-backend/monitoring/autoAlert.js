// monitoring/autoAlert.js
import { db } from "../firebaseConfig.js";
import { ref, onValue, set, push, get } from "firebase/database";
import { getStockInfo } from "../db/stock.js";

// Threshold batas aman
const MAX_TEMP = 35;
const MIN_TEMP = 15;
const MIN_STOCK = 3;
const LOW_STOCK_PERCENTAGE = 20; // Alert jika stok < 20% dari stok awal

const machineRef = ref(db, "machines/");

onValue(machineRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach(async (machineId) => {
    const status = data[machineId].status;

    if (!status) return;

    const { temperature, humidity, stock } = status;
    const now = new Date().toISOString();

    // Ambil informasi stok lengkap
    const stockInfo = await getStockInfo(machineId);

    // Cek kondisi abnormal
    let alertMessage = null;
    let alertType = null;
    let alertPriority = "normal";

    // Alert suhu
    if (temperature > MAX_TEMP) {
      alertMessage = `🔥 Suhu tinggi (${temperature}°C) pada ${machineId}`;
      alertType = "temperature_high";
      alertPriority = "high";
    } else if (temperature < MIN_TEMP) {
      alertMessage = `❄️ Suhu terlalu rendah (${temperature}°C) pada ${machineId}`;
      alertType = "temperature_low";
      alertPriority = "high";
    }
    
    // Alert stok - dengan logika baru
    if (stockInfo) {
      const { current_stock, initial_stock, usage_percentage } = stockInfo;
      const remainingPercentage = 100 - usage_percentage;

      // Alert berdasarkan persentase stok tersisa
      if (remainingPercentage <= 10) {
        alertMessage = `🚨 STOK KRITIS! Tersisa ${current_stock}/${initial_stock} (${remainingPercentage.toFixed(1)}%) pada ${machineId}`;
        alertType = "stock_critical";
        alertPriority = "critical";
      } else if (remainingPercentage <= LOW_STOCK_PERCENTAGE) {
        alertMessage = `⚠️ Stok menipis: ${current_stock}/${initial_stock} (${remainingPercentage.toFixed(1)}%) pada ${machineId}`;
        alertType = "stock_low";
        alertPriority = "medium";
      } else if (current_stock <= MIN_STOCK) {
        // Fallback untuk backward compatibility
        alertMessage = `⚠️ Stok menipis (${current_stock} item) pada ${machineId}`;
        alertType = "stock_low";
        alertPriority = "medium";
      }
    } else {
      // Jika belum ada stock_info, gunakan logika lama
      if (stock <= MIN_STOCK) {
        alertMessage = `⚠️ Stok menipis (${stock} item) pada ${machineId}`;
        alertType = "stock_low";
        alertPriority = "medium";
      }
    }

    // Kalau ada alert, tulis ke Firebase
    if (alertMessage) {
      const alertRef = push(ref(db, "alerts/"));
      await set(alertRef, {
        machineId,
        message: alertMessage,
        type: alertType,
        priority: alertPriority,
        timestamp: now,
        stock_info: stockInfo ? {
          current: stockInfo.current_stock,
          initial: stockInfo.initial_stock,
          percentage: stockInfo.usage_percentage,
        } : null,
      });

      console.log(`🚨 ALERT [${alertPriority.toUpperCase()}]:`, alertMessage);
    }

    // Simpan log history setiap kali update
    const historyRef = push(ref(db, "history/"));
    await set(historyRef, {
      machineId,
      temperature,
      humidity,
      stock,
      stock_info: stockInfo ? {
        current: stockInfo.current_stock,
        initial: stockInfo.initial_stock,
        used: stockInfo.used_stock,
        percentage: stockInfo.usage_percentage,
      } : null,
      timestamp: now,
    });

    console.log(`🕒 History updated for ${machineId}${stockInfo ? ` | Stok: ${stockInfo.current_stock}/${stockInfo.initial_stock}` : ''}`);
  });
});

console.log("🚀 Auto Alert System Started - Monitoring all machines...");
console.log(`📊 Thresholds: Temp ${MIN_TEMP}-${MAX_TEMP}°C | Stock Alert: ${LOW_STOCK_PERCENTAGE}%`);