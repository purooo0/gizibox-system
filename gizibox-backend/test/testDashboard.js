// test/testDashboard.js
import { 
  initializeSchoolStock, 
  updateSchoolStudentCount,
  refillMBGStock,
  getMachineDetail,
  getAllMachinesOverview,
  getMachineAlerts,
  getRefillHistory
} from "../db/dashboard.js";

/**
 * Test 1: Inisialisasi stok awal untuk sekolah
 */
async function testInitializeStock() {
  console.log("\n=== TEST 1: Initialize School Stock ===");
  
  try {
    const result = await initializeSchoolStock("machine_001", 1000, {
      school_name: "SDN 1 Jakarta",
      school_id: "sdn1_jkt",
    });
    
    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Test 2: Update jumlah siswa aktif
 */
async function testUpdateStudentCount() {
  console.log("\n=== TEST 2: Update Student Count ===");
  
  try {
    const result = await updateSchoolStudentCount("machine_001", 1050);
    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Test 3: Refill stok MBG
 */
async function testRefillStock() {
  console.log("\n=== TEST 3: Refill Stock ===");
  
  try {
    const result = await refillMBGStock("machine_001", 500, "Pengiriman MBG batch 2");
    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Test 4: Get detail mesin
 */
async function testGetMachineDetail() {
  console.log("\n=== TEST 4: Get Machine Detail ===");
  
  try {
    const detail = await getMachineDetail("machine_001");
    console.log("✅ Machine Detail:");
    console.log(JSON.stringify(detail, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Test 5: Get overview semua mesin (admin)
 */
async function testGetAllMachinesOverview() {
  console.log("\n=== TEST 5: Get All Machines Overview ===");
  
  try {
    const overview = await getAllMachinesOverview();
    console.log(`✅ Found ${overview.length} machines`);
    overview.forEach(machine => {
      console.log(`\n📍 ${machine.machineId}:`);
      console.log(`   Siswa: ${machine.school_info?.student_count || 'N/A'}`);
      console.log(`   Stok: ${machine.stock_info?.current_stock || 'N/A'}/${machine.stock_info?.initial_stock || 'N/A'}`);
      console.log(`   Usage: ${machine.stock_info?.usage_percentage || 'N/A'}%`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Test 6: Get alerts untuk mesin
 */
async function testGetMachineAlerts() {
  console.log("\n=== TEST 6: Get Machine Alerts ===");
  
  try {
    const alerts = await getMachineAlerts("machine_001", 5);
    console.log(`✅ Found ${alerts.length} alerts`);
    alerts.forEach(alert => {
      console.log(`\n🚨 [${alert.priority}] ${alert.message}`);
      console.log(`   Time: ${alert.timestamp}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Test 7: Get refill history
 */
async function testGetRefillHistory() {
  console.log("\n=== TEST 7: Get Refill History ===");
  
  try {
    const history = await getRefillHistory("machine_001", 5);
    console.log(`✅ Found ${history.length} refill records`);
    history.forEach(record => {
      console.log(`\n📦 Refill: +${record.refill_amount} → Total: ${record.new_total}`);
      console.log(`   Time: ${record.timestamp}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Jalankan semua test
async function runAllTests() {
  console.log("🧪 Starting Dashboard Tests...\n");
  
  // Test 1: Initialize stock (uncomment jika ingin test)
  // await testInitializeStock();
  
  // Test 2: Update student count
  // await testUpdateStudentCount();
  
  // Test 3: Refill stock
  // await testRefillStock();
  
  // Test 4: Get machine detail
  await testGetMachineDetail();
  
  // Test 5: Get all machines overview
  await testGetAllMachinesOverview();
  
  // Test 6: Get alerts
  await testGetMachineAlerts();
  
  // Test 7: Get refill history
  await testGetRefillHistory();
  
  console.log("\n✅ All tests completed!");
  process.exit(0);
}

// Uncomment untuk menjalankan test tertentu:
// testInitializeStock();
// testGetMachineDetail();

// Atau jalankan semua test:
runAllTests();
