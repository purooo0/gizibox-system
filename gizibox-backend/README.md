# 🏥 GiziBox Backend

Backend system untuk vending machine MBG (Makanan Bergizi) dengan monitoring real-time dan manajemen stok berbasis jumlah siswa aktif.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Jalankan monitoring system
npm start

# Test koneksi Firebase
npm run test-connection

# Test dashboard functions
npm run test-dashboard
```

## 📁 Struktur Project

```
gizibox-backend/
├── auth/                    # Authentication (login, register, logout)
├── db/                      # Database operations
│   ├── stock.js            # ⭐ Stock management (NEW!)
│   ├── dashboard.js        # ⭐ Dashboard operations (NEW!)
│   ├── users.js            # User CRUD
│   ├── machines.js         # Machine operations
│   ├── alerts.js           # Alert management
│   └── history.js          # History logging
├── monitoring/
│   └── autoAlert.js        # ⭐ Real-time monitoring (UPDATED!)
├── middleware/              # Auth & role checking
├── iot/                     # IoT operations (send/clear data)
├── test/                    # Testing files
├── examples/                # ⭐ Integration examples (NEW!)
└── firebaseConfig.js        # Firebase configuration
```

## 🆕 Fitur Baru: Stock Management

### Konsep
- Pengelola sekolah input jumlah siswa aktif dari **dashboard frontend**
- Stok awal MBG = jumlah siswa aktif
- Monitoring otomatis dengan alert berbasis persentase (20% low, 10% critical)
- Statistik: rata-rata penggunaan, estimasi hari tersisa

### Alur User
1. **Register** → User bikin akun
2. **Login** → User login
3. **Setup Stok Awal** → Input jumlah siswa di dashboard (misal: 1000 siswa)
4. **Monitoring** → Sistem otomatis tracking stok real-time
5. **Alert** → Notifikasi otomatis jika stok < 20%
6. **Refill** → User tambah stok dari dashboard

### Backend Functions (untuk Frontend)

```javascript
// 1. Set stok awal (pertama kali)
import { initializeSchoolStock } from "./db/dashboard.js";
await initializeSchoolStock("machine_001", 1000, {
  school_name: "SDN 1 Jakarta",
  school_id: "sdn1"
});

// 2. Load dashboard data
import { getMachineDetail } from "./db/dashboard.js";
const data = await getMachineDetail("machine_001");

// 3. Refill stok
import { refillMBGStock } from "./db/dashboard.js";
await refillMBGStock("machine_001", 500, "Pengiriman batch 2");

// 4. Real-time monitoring
import { ref, onValue } from "firebase/database";
onValue(ref(db, `machines/${machineId}/stock_info`), (snapshot) => {
  const stockInfo = snapshot.val();
  console.log(`Stok: ${stockInfo.current_stock}/${stockInfo.initial_stock}`);
});
```

## 📚 Dokumentasi Lengkap

| File | Deskripsi |
|------|-----------|
| 📄 `dokumentasi.md` | Dokumentasi lengkap sistem & struktur Firebase |
| 📄 `STOCK_MANAGEMENT.md` | Dokumentasi stock management system |
| 📄 `USER_FLOW.md` | ⭐ Alur lengkap user dari register sampai monitoring |
| 📄 `examples/frontendIntegration.js` | ⭐ Contoh kode untuk integrasi frontend |
| 📄 `examples/dashboardExample.js` | Contoh penggunaan dashboard functions |

## 🔑 Key Features

### 1. Authentication
- Register user (admin/school)
- Login dengan role-based access
- Logout

### 2. Stock Management ⭐ NEW!
- Set stok awal berdasarkan jumlah siswa
- Refill stok dengan history logging
- Update jumlah siswa aktif
- Get stock info & statistics
- Real-time monitoring

### 3. Alert System
- **Critical**: Stok < 10%
- **Medium**: Stok < 20%
- **High**: Suhu abnormal (> 35°C atau < 15°C)
- Auto alert dengan priority level

### 4. Dashboard Operations
- Get machine detail (untuk sekolah)
- Get all machines overview (untuk admin)
- Get alerts history
- Get refill history

### 5. Real-time Monitoring
- Auto tracking stok, suhu, kelembaban
- Alert otomatis
- History logging
- Firebase Realtime Database

## 🗄️ Database Structure

```
/users/{uid}
  ├── email
  ├── role (admin/school)
  └── machineId

/machines/{machineId}
  ├── status/
  │   ├── temperature
  │   ├── humidity
  │   └── stock
  ├── stock_info/ ⭐ NEW!
  │   ├── initial_stock (= jumlah siswa)
  │   ├── current_stock
  │   ├── student_count
  │   └── usage_percentage
  └── school_info/ ⭐ NEW!
      ├── school_name
      ├── student_count
      └── last_refill

/alerts/{alert_id}
  ├── machineId
  ├── message
  ├── type ⭐ NEW!
  ├── priority ⭐ NEW!
  └── timestamp

/refill_history/{refill_id} ⭐ NEW!
  ├── machineId
  ├── refill_amount
  ├── new_total
  └── timestamp
```

## 🧪 Testing

```bash
# Test koneksi Firebase
npm run test-connection

# Test dashboard functions
npm run test-dashboard

# Test login
npm run login

# Test register
npm run register
```

## 📱 Untuk Frontend Developer

**Lihat file ini untuk integrasi:**
1. `USER_FLOW.md` - Alur lengkap dari register sampai monitoring
2. `examples/frontendIntegration.js` - Contoh kode React/Vue lengkap
3. `STOCK_MANAGEMENT.md` - API reference & use cases

**Import functions dari:**
- `db/dashboard.js` - Main dashboard operations
- `db/stock.js` - Stock management functions
- `auth/loginUser.js` - Login
- `auth/registerUser.js` - Register

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Jalankan monitoring system |
| `npm run test-connection` | Test Firebase connection |
| `npm run test-dashboard` | Test dashboard functions |
| `npm run login` | Test login |
| `npm run register` | Test register |
| `npm run clear` | Clear database |

## ⚠️ Important Notes

1. **Backend = Logic Only** - Tidak ada input manual di backend
2. **Frontend = Input Data** - User input semua data dari dashboard
3. **Real-time** - Semua perubahan langsung update via Firebase
4. **Auto Alert** - Backend monitoring otomatis kirim alert
5. **Backward Compatible** - Support mesin lama tanpa stock_info

## 🔐 Security

- API Key terekspos di `firebaseConfig.js` (untuk development)
- Production: Gunakan environment variables
- Firebase Rules: Perlu diset untuk production

---

**Last Updated**: November 4, 2025
**Version**: 2.0 (with Stock Management System)
