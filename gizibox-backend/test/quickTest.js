// test/quickTest.js
// Quick test untuk cek apakah semua fungsi baru berjalan

import { initializeSchoolStock, getMachineDetail } from "../db/dashboard.js";
import { getStockInfo } from "../db/stock.js";

console.log("🧪 QUICK TEST - Stock Management System\n");
console.log("=".repeat(60));

// Test 1: Cek apakah fungsi bisa diimport
console.log("\n✅ Test 1: Import Functions");
console.log("   - initializeSchoolStock:", typeof initializeSchoolStock);
console.log("   - getMachineDetail:", typeof getMachineDetail);
console.log("   - getStockInfo:", typeof getStockInfo);

// Test 2: Set stok awal
console.log("\n🔄 Test 2: Set Stok Awal");
try {
  const result = await initializeSchoolStock("machine_test", 100, {
    school_name: "Test School",
    school_id: "test_001"
  });
  console.log("   ✅ Berhasil set stok awal!");
  console.log("   📊 Initial Stock:", result.stockData.initial_stock);
  console.log("   📊 Current Stock:", result.stockData.current_stock);
} catch (error) {
  console.log("   ❌ Error:", error.message);
}

// Test 3: Get detail mesin
console.log("\n🔄 Test 3: Get Machine Detail");
try {
  const detail = await getMachineDetail("machine_test");
  console.log("   ✅ Berhasil get detail!");
  console.log("   🏫 School:", detail.school_info?.school_name);
  console.log("   👥 Students:", detail.school_info?.student_count);
  console.log("   📦 Stock:", detail.stock_info?.current_stock + "/" + detail.stock_info?.initial_stock);
} catch (error) {
  console.log("   ❌ Error:", error.message);
}

// Test 4: Get stock info
console.log("\n🔄 Test 4: Get Stock Info");
try {
  const stockInfo = await getStockInfo("machine_test");
  if (stockInfo) {
    console.log("   ✅ Berhasil get stock info!");
    console.log("   📊 Usage:", stockInfo.usage_percentage + "%");
    console.log("   📊 Used:", stockInfo.used_stock);
  } else {
    console.log("   ⚠️ Stock info belum ada");
  }
} catch (error) {
  console.log("   ❌ Error:", error.message);
}

console.log("\n" + "=".repeat(60));
console.log("✅ Quick Test Selesai!\n");

process.exit(0);
