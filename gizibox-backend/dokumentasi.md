# 📘 Dokumentasi Integrasi Sistem GiziBox
**Disusun oleh:** Adhelia Putri Maylani
**Peran:** Backend Developer  

---

## 🧭 Tujuan
Dokumentasi ini menjelaskan integrasi antara **Frontend (Fabio)** dan **IoT Hardware (Faruq)** dengan sistem backend GiziBox berbasis **Firebase Realtime Database** dan **Firebase Authentication**.  
Tujuan utama: memastikan komunikasi antar komponen berjalan real-time, aman, dan stabil.

---

## ⚙️ 1️⃣ Struktur Firebase

/users
├── {uid}
│ ├── email: string
│ ├── role: "admin" | "school"
│ └── machineId: string (khusus user sekolah)

/machines
├── machine_001
│ ├── status
│ │ ├── temperature: number
│ │ ├── humidity: number
│ │ ├── stock: number
│ │ └── last_update: string
│ ├── stock_info (NEW!)
│ │ ├── initial_stock: number (stok awal = jumlah siswa)
│ │ ├── current_stock: number (stok saat ini)
│ │ ├── student_count: number (jumlah siswa aktif)
│ │ ├── last_refill: string (timestamp refill terakhir)
│ │ └── last_updated: string
│ └── school_info (NEW!)
│   ├── student_count: number
│   ├── school_name: string
│   ├── school_id: string
│   ├── last_refill: string
│   ├── last_refill_amount: number
│   ├── refill_notes: string
│   └── last_updated: string

/alerts
├── {alert_id}
│ ├── machineId: string
│ ├── message: string
│ ├── type: string (NEW! temperature_high/low, stock_low/critical)
│ ├── priority: string (NEW! normal/medium/high/critical)
│ ├── stock_info: object (NEW! snapshot stok saat alert)
│ └── timestamp: string

/history
├── {log_id}
│ ├── machineId: string
│ ├── temperature: number
│ ├── humidity: number
│ ├── stock: number
│ ├── stock_info: object (NEW! detail stok)
│ └── timestamp: string

/refill_history (NEW!)
├── {refill_id}
│ ├── machineId: string
│ ├── refill_amount: number
│ ├── new_total: number
│ ├── timestamp: string
│ └── type: "refill"


---

## 💻 2️⃣ (Frontend Developer – React.js)

### 🔐 Login & Role Detection
```javascript
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get, onValue } from "firebase/database";
import { app } from "./firebaseConfig";

const auth = getAuth(app);
const db = getDatabase(app);

async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  const snapshot = await get(ref(db, "users/" + uid));
  const userData = snapshot.val();

  if (userData.role === "admin") {
    router.push("/admin/dashboard");
  } else if (userData.role === "school") {
    router.push("/school/dashboard");
  }
}
```

### 📡 Realtime Data
```javascript
import { onValue, ref } from "firebase/database";
import { db } from "./firebaseConfig";

function listenMachine(machineId) {
  const path = `machines/${machineId}/status`;
  onValue(ref(db, path), (snapshot) => {
    console.log("📡 Data Realtime:", snapshot.val());
  });
}
```

### 📢 Alerts & History
```javascript
onValue(ref(db, "alerts"), (snapshot) => console.log("🚨 Alerts:", snapshot.val()));
onValue(ref(db, "history"), (snapshot) => console.log("🕒 History:", snapshot.val()));
```

### 📊 Data Contoh (IoT)
```javascript
{
  "temperature": 30.5,
  "humidity": 65,
  "stock": 4,
  "last_update": "2025-10-13T10:20:00Z"
}
```

### 🧱 1️⃣ Persiapan Awal
Pastikan sudah punya:
Node.js versi 18+

Cek Node:
```
node -v
npm -v
```
Masuk ke folder backend:
```
cd gizibox-backend
```

### 📦 2️⃣ Install Dependency
```
npm install firebase
```

| Perintah                  | Fungsi                                |
| ------------------------- | ------------------------------------- |
| `npm run start`           | Menjalankan autoAlert & backend penuh |
| `npm run test-connection` | Tes koneksi Firebase                  |
| `npm run login`           | Coba login user/admin                 |
| `npm run register`        | Tambah user baru ke Firebase          |
| `npm run clear`           | Hapus data di database                |

---

## 🆕 3️⃣ Fitur Baru: Manajemen Stok Berdasarkan Jumlah Siswa

### 📋 Konsep
- Setiap sekolah mendata jumlah siswa aktif
- Stok awal MBG = jumlah siswa aktif
- Sistem tracking stok berdasarkan persentase penggunaan
- Alert otomatis ketika stok < 20% atau < 10% (kritis)

### 🔧 Fungsi Dashboard (Backend)

#### 1. Inisialisasi Stok Awal
```javascript
import { initializeSchoolStock } from "./db/dashboard.js";

// Set stok awal untuk sekolah dengan 1000 siswa
await initializeSchoolStock("machine_001", 1000, {
  school_name: "SDN 1 Jakarta",
  school_id: "sdn1_jkt"
});
```

#### 2. Update Jumlah Siswa Aktif
```javascript
import { updateSchoolStudentCount } from "./db/dashboard.js";

// Update jumlah siswa menjadi 1050
await updateSchoolStudentCount("machine_001", 1050);
```

#### 3. Refill Stok MBG
```javascript
import { refillMBGStock } from "./db/dashboard.js";

// Refill 500 MBG dengan catatan
await refillMBGStock("machine_001", 500, "Pengiriman batch 2");
```

#### 4. Get Detail Mesin (untuk Dashboard Sekolah)
```javascript
import { getMachineDetail } from "./db/dashboard.js";

const detail = await getMachineDetail("machine_001");
// Returns: status, school_info, stock_info, stock_statistics
```

#### 5. Get Overview Semua Mesin (untuk Dashboard Admin)
```javascript
import { getAllMachinesOverview } from "./db/dashboard.js";

const overview = await getAllMachinesOverview();
// Returns array of all machines with complete info
```

### 📊 Stock Info Response
```javascript
{
  "initial_stock": 1000,        // Stok awal
  "current_stock": 750,          // Stok saat ini
  "student_count": 1000,         // Jumlah siswa
  "used_stock": 250,             // Sudah terpakai
  "usage_percentage": 25.00,     // Persentase terpakai
  "last_refill": "2025-11-03T...",
  "last_updated": "2025-11-03T..."
}
```

### 📊 Stock Statistics Response
```javascript
{
  ...stock_info,
  "days_active": 15,                    // Hari sejak refill terakhir
  "avg_daily_usage": 16.67,             // Rata-rata penggunaan per hari
  "estimated_days_remaining": 45        // Estimasi hari tersisa
}
```

### 🚨 Alert System (Updated)
```javascript
// Alert Priority Levels:
// - critical: Stok < 10% (KRITIS!)
// - high: Suhu abnormal
// - medium: Stok < 20%
// - normal: Info biasa

// Contoh Alert Response:
{
  "machineId": "machine_001",
  "message": "🚨 STOK KRITIS! Tersisa 50/1000 (5.0%) pada machine_001",
  "type": "stock_critical",
  "priority": "critical",
  "stock_info": {
    "current": 50,
    "initial": 1000,
    "percentage": 95.0
  },
  "timestamp": "2025-11-03T..."
}
```

### 🧪 Testing
```bash
# Test dashboard functions
node test/testDashboard.js
```

### 📱 Integrasi Frontend

#### Set Stok Awal dari Dashboard
```javascript
// Ketika admin/sekolah input jumlah siswa
async function setInitialStock(machineId, studentCount, schoolInfo) {
  const response = await fetch('YOUR_API/initialize-stock', {
    method: 'POST',
    body: JSON.stringify({
      machineId,
      studentCount,
      schoolInfo
    })
  });
  return response.json();
}
```

#### Monitor Stok Real-time
```javascript
import { ref, onValue } from "firebase/database";

// Listen perubahan stok
onValue(ref(db, `machines/${machineId}/stock_info`), (snapshot) => {
  const stockInfo = snapshot.val();
  console.log(`Stok: ${stockInfo.current_stock}/${stockInfo.initial_stock}`);
  console.log(`Terpakai: ${stockInfo.usage_percentage}%`);
});
```

#### Get Statistik untuk Dashboard
```javascript
import { getMachineDetail } from "./db/dashboard.js";

const detail = await getMachineDetail("machine_001");

// Tampilkan di dashboard:
// - Jumlah siswa: detail.school_info.student_count
// - Stok tersisa: detail.stock_info.current_stock
// - Persentase: detail.stock_info.usage_percentage
// - Estimasi hari: detail.stock_statistics.estimated_days_remaining
```

---

## 📝 Catatan Penting

1. **Backward Compatibility**: Sistem tetap support mesin yang belum set `stock_info`
2. **Auto Alert**: Monitoring otomatis dengan 3 level priority (medium/high/critical)
3. **History Tracking**: Semua perubahan stok tercatat di `history` dan `refill_history`
4. **Statistik**: Sistem menghitung rata-rata penggunaan dan estimasi hari tersisa
5. **Refill**: Setiap refill akan update `initial_stock` dan log ke history