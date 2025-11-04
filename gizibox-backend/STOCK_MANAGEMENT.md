# 📦 Stock Management System - GiziBox

## 🎯 Overview
Sistem manajemen stok MBG (Makanan Bergizi) berbasis jumlah siswa aktif di sekolah.

**PENTING:** 
- ✅ Backend hanya menyediakan **LOGIKA/FUNGSI**
- ✅ Input data dilakukan dari **FRONTEND DASHBOARD** oleh user (pengelola sekolah)
- ✅ User register → login → input stok awal di dashboard → monitoring otomatis

## 🔑 Fitur Utama

### 1. **Set Stok Awal**
Pengelola sekolah input jumlah siswa aktif → sistem set stok awal = jumlah siswa

```javascript
import { initializeSchoolStock } from "./db/dashboard.js";

// Contoh: Sekolah A punya 1000 siswa aktif
await initializeSchoolStock("machine_001", 1000, {
  school_name: "SDN 1 Jakarta",
  school_id: "sdn1_jkt"
});
```

### 2. **Tracking Stok Real-time**
- Stok berkurang otomatis ketika siswa ambil MBG (dari IoT)
- Sistem hitung persentase penggunaan
- Alert otomatis berdasarkan threshold

### 3. **Alert System**
| Kondisi | Alert | Priority |
|---------|-------|----------|
| Stok < 10% | 🚨 STOK KRITIS! | Critical |
| Stok < 20% | ⚠️ Stok menipis | Medium |
| Suhu > 35°C | 🔥 Suhu tinggi | High |
| Suhu < 15°C | ❄️ Suhu rendah | High |

### 4. **Refill Stok**
Ketika ada pengiriman MBG baru:

```javascript
import { refillMBGStock } from "./db/dashboard.js";

// Refill 500 MBG
await refillMBGStock("machine_001", 500, "Pengiriman batch 2");
```

### 5. **Statistik & Analytics**
- Rata-rata penggunaan per hari
- Estimasi hari tersisa
- History refill
- Usage percentage

## 📊 Data Structure

### Stock Info
```javascript
{
  initial_stock: 1000,      // Stok awal (= jumlah siswa)
  current_stock: 750,       // Stok saat ini
  student_count: 1000,      // Jumlah siswa aktif
  used_stock: 250,          // Sudah terpakai
  usage_percentage: 25.0,   // % terpakai
  last_refill: "2025-11-03T...",
  last_updated: "2025-11-03T..."
}
```

### Stock Statistics
```javascript
{
  ...stock_info,
  days_active: 15,                 // Hari sejak refill
  avg_daily_usage: 16.67,          // Rata-rata per hari
  estimated_days_remaining: 45     // Estimasi hari tersisa
}
```

## 🚀 Quick Start

### Backend Developer (Testing)

```bash
# 1. Test dashboard functions
npm run test-dashboard

# 2. Jalankan monitoring
npm start
```

### Frontend Developer (Integrasi)

**Lihat file lengkap:**
- 📄 `USER_FLOW.md` - Alur lengkap user dari register sampai monitoring
- 📄 `examples/frontendIntegration.js` - Contoh kode lengkap untuk React/Vue

**Flow Singkat:**
1. User register → `handleRegister(email, password)`
2. User login → `handleLogin(email, password)`
3. User input stok awal di dashboard → `handleSetInitialStock(formData)`
4. Load dashboard → `loadDashboardData(machineId)`
5. Tambah stok → `handleRefillStock(formData)`
6. Real-time monitoring → `setupRealtimeMonitoring(machineId, callback)`

## 📱 Integrasi Frontend

### Dashboard Sekolah
```javascript
import { getMachineDetail } from "./db/dashboard.js";

// Get detail mesin untuk dashboard
const detail = await getMachineDetail("machine_001");

// Tampilkan:
// - Siswa aktif: detail.school_info.student_count
// - Stok tersisa: detail.stock_info.current_stock
// - Persentase: detail.stock_info.usage_percentage
// - Estimasi hari: detail.stock_statistics.estimated_days_remaining
```

### Dashboard Admin
```javascript
import { getAllMachinesOverview } from "./db/dashboard.js";

// Get overview semua mesin
const overview = await getAllMachinesOverview();

// Loop untuk tampilkan semua mesin
overview.forEach(machine => {
  console.log(`${machine.machineId}: ${machine.stock_info.current_stock}/${machine.stock_info.initial_stock}`);
});
```

### Real-time Monitoring
```javascript
import { ref, onValue } from "firebase/database";

// Listen perubahan stok real-time
onValue(ref(db, `machines/${machineId}/stock_info`), (snapshot) => {
  const stockInfo = snapshot.val();
  updateUI(stockInfo);
});
```

## 🔧 API Functions

### Stock Management (`db/stock.js`)
- `setInitialStock(machineId, studentCount)` - Set stok awal
- `updateStudentCount(machineId, count)` - Update jumlah siswa
- `refillStock(machineId, amount)` - Refill stok
- `decreaseStock(machineId, amount)` - Kurangi stok (dari IoT)
- `getStockInfo(machineId)` - Get info stok
- `getStockStatistics(machineId)` - Get statistik lengkap

### Dashboard Operations (`db/dashboard.js`)
- `initializeSchoolStock(machineId, studentCount, schoolInfo)` - Init sekolah
- `updateSchoolStudentCount(machineId, count)` - Update siswa
- `refillMBGStock(machineId, amount, notes)` - Refill dengan notes
- `getMachineDetail(machineId)` - Get detail 1 mesin
- `getAllMachinesOverview()` - Get semua mesin (admin)
- `getMachineAlerts(machineId, limit)` - Get alerts
- `getRefillHistory(machineId, limit)` - Get history refill

## 🎨 Use Cases

### Use Case 1: Sekolah Baru
1. Admin/sekolah input jumlah siswa: 1000
2. Sistem set `initial_stock = 1000`
3. Monitoring dimulai
4. Alert otomatis jika stok < 200 (20%)

### Use Case 2: Refill MBG
1. Stok tersisa: 100/1000 (10%) → Alert KRITIS
2. Pengiriman MBG: 500 unit
3. Admin klik "Refill" → input 500
4. Stok update: 600/600 (reset initial_stock)
5. History tercatat

### Use Case 3: Update Jumlah Siswa
1. Siswa awal: 1000
2. Siswa baru masuk: 50 orang
3. Admin update: 1050
4. Sistem update `student_count` (tidak reset stok)

## ⚠️ Important Notes

1. **Backward Compatibility**: Sistem tetap support mesin lama tanpa `stock_info`
2. **Auto Sync**: Perubahan stok di `stock_info` otomatis sync ke `status.stock`
3. **History**: Semua perubahan tercatat di `history` dan `refill_history`
4. **Real-time**: Semua data real-time via Firebase Realtime Database

## 📞 Support

Untuk pertanyaan atau issue, hubungi Backend Developer: Adhelia Putri Maylani
