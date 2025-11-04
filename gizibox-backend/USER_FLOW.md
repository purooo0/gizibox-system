# 👤 User Flow - Pengelola Sekolah

## 📋 Alur Lengkap dari Register sampai Monitoring

### **STEP 1: Register Akun** 📝

**User Action:**
- User (pengelola sekolah) buka halaman register
- Isi form:
  - Email: `sdn1@sch.id`
  - Password: `******`
  - Nama Sekolah: `SDN 1 Jakarta`

**Frontend Call:**
```javascript
import { handleRegister } from "./examples/frontendIntegration.js";

const result = await handleRegister(
  "sdn1@sch.id",
  "password123",
  "school"  // role
);
```

**Backend Action:**
- Create user di Firebase Auth
- Simpan data ke `/users/{uid}`:
  ```json
  {
    "email": "sdn1@sch.id",
    "role": "school",
    "createdAt": "2025-11-03T..."
    // machineId belum ada (akan diset di step 3)
  }
  ```

---

### **STEP 2: Login** 🔐

**User Action:**
- User login dengan email & password

**Frontend Call:**
```javascript
import { handleLogin } from "./examples/frontendIntegration.js";

const userData = await handleLogin("sdn1@sch.id", "password123");
// Returns: { uid, email, role, machineId (null jika belum setup) }
```

**Backend Action:**
- Authenticate user
- Return user data

**Frontend Logic:**
```javascript
if (!userData.machineId) {
  // User belum setup stok awal
  router.push('/setup-initial-stock');
} else {
  // User sudah setup, langsung ke dashboard
  router.push('/dashboard');
}
```

---

### **STEP 3: Setup Stok Awal (Pertama Kali)** 🎯

**User Action:**
- User diarahkan ke halaman "Setup Stok Awal"
- Isi form:
  - Nama Sekolah: `SDN 1 Jakarta Pusat`
  - Jumlah Siswa Aktif: `1000`
  - ID Mesin: `machine_001` (auto-generate atau input manual)

**Frontend UI:**
```jsx
<form onSubmit={handleSubmit}>
  <input 
    type="text" 
    placeholder="Nama Sekolah"
    value={schoolName}
    onChange={(e) => setSchoolName(e.target.value)}
  />
  
  <input 
    type="number" 
    placeholder="Jumlah Siswa Aktif"
    value={studentCount}
    onChange={(e) => setStudentCount(e.target.value)}
  />
  
  <button type="submit">Set Stok Awal</button>
</form>
```

**Frontend Call:**
```javascript
import { handleSetInitialStock } from "./examples/frontendIntegration.js";

const formData = {
  schoolName: "SDN 1 Jakarta Pusat",
  studentCount: 1000,
  machineId: "machine_001"  // auto-generate: `machine_${uid.slice(0,8)}`
};

const result = await handleSetInitialStock(formData);
```

**Backend Action:**
1. Simpan ke `/machines/machine_001/stock_info`:
   ```json
   {
     "initial_stock": 1000,
     "current_stock": 1000,
     "student_count": 1000,
     "last_refill": "2025-11-03T...",
     "last_updated": "2025-11-03T..."
   }
   ```

2. Simpan ke `/machines/machine_001/school_info`:
   ```json
   {
     "student_count": 1000,
     "school_name": "SDN 1 Jakarta Pusat",
     "school_id": "machine_001",
     "last_updated": "2025-11-03T..."
   }
   ```

3. Update `/users/{uid}`:
   ```json
   {
     "email": "sdn1@sch.id",
     "role": "school",
     "machineId": "machine_001"  // ← DITAMBAHKAN
   }
   ```

4. Update `/machines/machine_001/status`:
   ```json
   {
     "stock": 1000,
     "last_update": "2025-11-03T..."
   }
   ```

**Frontend Action:**
```javascript
// Setelah berhasil, redirect ke dashboard
router.push('/dashboard');
```

---

### **STEP 4: Dashboard - Lihat Data** 📊

**User Action:**
- User masuk dashboard
- Lihat info stok, status mesin, statistik

**Frontend Call:**
```javascript
import { loadDashboardData } from "./examples/frontendIntegration.js";

const data = await loadDashboardData("machine_001");

// Data yang didapat:
// {
//   schoolName: "SDN 1 Jakarta Pusat",
//   studentCount: 1000,
//   currentStock: 1000,
//   initialStock: 1000,
//   usagePercentage: 0,
//   temperature: 28,
//   humidity: 60,
//   avgDailyUsage: 0,
//   estimatedDaysRemaining: null
// }
```

**Frontend UI:**
```jsx
<div className="dashboard">
  <h1>{data.schoolName}</h1>
  
  <div className="stock-card">
    <h2>Stok MBG</h2>
    <p>Tersisa: {data.currentStock} / {data.initialStock}</p>
    <p>Terpakai: {data.usagePercentage}%</p>
    <ProgressBar value={data.usagePercentage} />
  </div>
  
  <div className="status-card">
    <h2>Status Mesin</h2>
    <p>Suhu: {data.temperature}°C</p>
    <p>Kelembaban: {data.humidity}%</p>
  </div>
  
  <div className="stats-card">
    <h2>Statistik</h2>
    <p>Rata-rata per hari: {data.avgDailyUsage} MBG</p>
    <p>Estimasi hari tersisa: {data.estimatedDaysRemaining} hari</p>
  </div>
</div>
```

---

### **STEP 5: Real-time Monitoring** 🔄

**Frontend Setup:**
```javascript
import { setupRealtimeMonitoring } from "./examples/frontendIntegration.js";

useEffect(() => {
  // Setup listener untuk perubahan real-time
  const unsubscribe = setupRealtimeMonitoring("machine_001", (stockInfo) => {
    // Update UI otomatis ketika ada perubahan
    setCurrentStock(stockInfo.currentStock);
    setUsagePercentage(stockInfo.usagePercentage);
    
    // Auto alert
    const remaining = 100 - stockInfo.usagePercentage;
    if (remaining <= 10) {
      showAlert("KRITIS! Stok hampir habis!");
    }
  });
  
  // Cleanup on unmount
  return () => unsubscribe();
}, []);
```

**Backend Action:**
- `autoAlert.js` monitoring terus berjalan
- Setiap ada perubahan stok → Firebase update
- Frontend otomatis dapat update via listener

---

### **STEP 6: Tambah Stok (Refill)** ➕

**User Action:**
- User klik tombol "Tambah Stok"
- Isi form:
  - Jumlah Tambahan: `500`
  - Catatan: `Pengiriman batch 2`

**Frontend UI:**
```jsx
<button onClick={() => setShowRefillModal(true)}>
  Tambah Stok
</button>

<Modal show={showRefillModal}>
  <form onSubmit={handleRefill}>
    <input 
      type="number" 
      placeholder="Jumlah Tambahan"
      value={refillAmount}
    />
    <textarea 
      placeholder="Catatan (opsional)"
      value={notes}
    />
    <button type="submit">Refill</button>
  </form>
</Modal>
```

**Frontend Call:**
```javascript
import { handleRefillStock } from "./examples/frontendIntegration.js";

const formData = {
  machineId: "machine_001",
  refillAmount: 500,
  notes: "Pengiriman batch 2"
};

const result = await handleRefillStock(formData);
// Returns: { refillAmount: 500, newTotal: 1500 }
```

**Backend Action:**
1. Update `/machines/machine_001/stock_info`:
   ```json
   {
     "initial_stock": 1500,      // ← UPDATED
     "current_stock": 1500,      // ← UPDATED
     "last_refill": "2025-11-03T..."  // ← UPDATED
   }
   ```

2. Log ke `/refill_history/{id}`:
   ```json
   {
     "machineId": "machine_001",
     "refill_amount": 500,
     "new_total": 1500,
     "timestamp": "2025-11-03T..."
   }
   ```

**Frontend Action:**
```javascript
// Update UI
setCurrentStock(result.newTotal);
showNotification(`Stok berhasil ditambah ${result.refillAmount}`, "success");
```

---

### **STEP 7: Update Jumlah Siswa** 👥

**User Action:**
- User klik "Edit Jumlah Siswa"
- Input jumlah baru: `1050` (ada 50 siswa baru)

**Frontend Call:**
```javascript
import { handleUpdateStudentCount } from "./examples/frontendIntegration.js";

const result = await handleUpdateStudentCount("machine_001", 1050);
```

**Backend Action:**
- Update `/machines/machine_001/stock_info`:
  ```json
  {
    "student_count": 1050  // ← UPDATED
  }
  ```
- Update `/machines/machine_001/school_info`:
  ```json
  {
    "student_count": 1050  // ← UPDATED
  }
  ```

**Note:** Ini hanya update jumlah siswa, **TIDAK** mengubah stok!

---

### **STEP 8: Lihat Alert & History** 🚨

**Frontend Call:**
```javascript
import { loadAlerts, loadRefillHistory } from "./examples/frontendIntegration.js";

// Get alerts
const alerts = await loadAlerts("machine_001", 5);

// Get refill history
const history = await loadRefillHistory("machine_001", 10);
```

**Frontend UI:**
```jsx
<div className="alerts-section">
  <h2>Notifikasi</h2>
  {alerts.map(alert => (
    <div key={alert.id} className={`alert-${alert.priority}`}>
      <p>{alert.message}</p>
      <small>{alert.timestamp}</small>
    </div>
  ))}
</div>

<div className="history-section">
  <h2>Riwayat Refill</h2>
  {history.map(record => (
    <div key={record.id}>
      <p>+{record.refillAmount} → Total: {record.newTotal}</p>
      <small>{record.timestamp}</small>
    </div>
  ))}
</div>
```

---

## 🔄 Summary Flow

```
1. REGISTER → Create account
   ↓
2. LOGIN → Authenticate
   ↓
3. CHECK machineId
   ├─ NULL → SETUP STOK AWAL (input jumlah siswa)
   └─ EXISTS → DASHBOARD
   ↓
4. DASHBOARD → Lihat data real-time
   ↓
5. MONITORING → Auto alert jika stok < 20%
   ↓
6. REFILL → Tambah stok ketika menipis
   ↓
7. UPDATE → Update jumlah siswa jika ada perubahan
```

---

## ⚙️ Backend Functions Summary

| Function | Dipanggil Kapan | Input dari Frontend |
|----------|----------------|---------------------|
| `initializeSchoolStock()` | Setup pertama kali | schoolName, studentCount, machineId |
| `refillMBGStock()` | Klik "Tambah Stok" | machineId, refillAmount, notes |
| `updateSchoolStudentCount()` | Edit jumlah siswa | machineId, newStudentCount |
| `getMachineDetail()` | Load dashboard | machineId |
| `loadAlerts()` | Load notifikasi | machineId, limit |
| `loadRefillHistory()` | Load riwayat | machineId, limit |

---

## 🎯 Key Points

1. ✅ **Backend = Logic Only** - Tidak ada input manual di backend
2. ✅ **Frontend = Input Data** - User input semua data dari dashboard
3. ✅ **Real-time** - Semua perubahan langsung update via Firebase
4. ✅ **Auto Alert** - Backend monitoring otomatis kirim alert
5. ✅ **History Tracking** - Semua perubahan tercatat

---