// test/testBugFix.js
// Test untuk memastikan temperature & humidity tidak hilang

import { db } from "../firebaseConfig.js";
import { ref, set, get, update } from "firebase/database";
import { initializeSchoolStock } from "../db/dashboard.js";

const TEST_MACHINE_ID = "machine_bugfix_test";

console.log("🧪 TEST: Temperature & Humidity Tidak Hilang\n");
console.log("=".repeat(70));

async function runTest() {
  try {
    // STEP 1: Setup data awal (simulasi data dari IoT)
    console.log("\n📝 STEP 1: Setup data awal (simulasi IoT)");
    await set(ref(db, `machines/${TEST_MACHINE_ID}/status`), {
      temperature: 28.5,
      humidity: 60,
      stock: 10,
      last_update: new Date().toISOString(),
    });
    console.log("   ✅ Data awal berhasil diset");
    console.log("   📊 Temperature: 28.5°C");
    console.log("   📊 Humidity: 60%");
    console.log("   📊 Stock: 10");

    // STEP 2: Baca data sebelum set stok awal
    console.log("\n📖 STEP 2: Baca data SEBELUM set stok awal");
    const beforeSnapshot = await get(ref(db, `machines/${TEST_MACHINE_ID}/status`));
    const beforeData = beforeSnapshot.val();
    console.log("   Data sebelum:", JSON.stringify(beforeData, null, 2));

    // STEP 3: Set stok awal (ini yang bikin bug sebelumnya)
    console.log("\n🔄 STEP 3: Set stok awal (initializeSchoolStock)");
    await initializeSchoolStock(TEST_MACHINE_ID, 1000, {
      school_name: "Test School",
      school_id: "test_001",
    });
    console.log("   ✅ Stok awal berhasil diset: 1000");

    // STEP 4: Baca data setelah set stok awal
    console.log("\n📖 STEP 4: Baca data SETELAH set stok awal");
    const afterSnapshot = await get(ref(db, `machines/${TEST_MACHINE_ID}/status`));
    const afterData = afterSnapshot.val();
    console.log("   Data setelah:", JSON.stringify(afterData, null, 2));

    // STEP 5: Validasi
    console.log("\n✅ STEP 5: Validasi");
    
    const checks = {
      temperature: afterData.temperature !== undefined,
      humidity: afterData.humidity !== undefined,
      stock: afterData.stock === 1000,
      temperatureValue: afterData.temperature === beforeData.temperature,
      humidityValue: afterData.humidity === beforeData.humidity,
    };

    console.log("\n📊 Hasil Validasi:");
    console.log("   Temperature ada?", checks.temperature ? "✅ YA" : "❌ TIDAK");
    console.log("   Humidity ada?", checks.humidity ? "✅ YA" : "❌ TIDAK");
    console.log("   Stock updated?", checks.stock ? "✅ YA (1000)" : "❌ TIDAK");
    console.log("   Temperature sama?", checks.temperatureValue ? "✅ YA" : "❌ TIDAK");
    console.log("   Humidity sama?", checks.humidityValue ? "✅ YA" : "❌ TIDAK");

    // STEP 6: Cek struktur lengkap
    console.log("\n📖 STEP 6: Cek struktur lengkap");
    const fullSnapshot = await get(ref(db, `machines/${TEST_MACHINE_ID}`));
    const fullData = fullSnapshot.val();
    
    console.log("\n📂 Struktur Lengkap:");
    console.log("   /status:");
    console.log("     - temperature:", fullData.status?.temperature);
    console.log("     - humidity:", fullData.status?.humidity);
    console.log("     - stock:", fullData.status?.stock);
    console.log("   /stock_info:");
    console.log("     - initial_stock:", fullData.stock_info?.initial_stock);
    console.log("     - current_stock:", fullData.stock_info?.current_stock);
    console.log("   /school_info:");
    console.log("     - school_name:", fullData.school_info?.school_name);
    console.log("     - student_count:", fullData.school_info?.student_count);

    // STEP 7: Final Result
    console.log("\n" + "=".repeat(70));
    const allPassed = Object.values(checks).every(check => check === true);
    
    if (allPassed) {
      console.log("✅ TEST PASSED!");
    } else {
      console.log("❌ TEST FAILED! Ada data yang hilang!");
      console.log("\nDetail:");
      if (!checks.temperature) console.log("   ❌ Temperature hilang!");
      if (!checks.humidity) console.log("   ❌ Humidity hilang!");
      if (!checks.stock) console.log("   ❌ Stock tidak terupdate!");
    }

    console.log("=".repeat(70));

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
  }

  process.exit(0);
}

// Jalankan test
runTest();
