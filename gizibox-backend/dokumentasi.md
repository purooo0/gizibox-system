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
│ └── status
│ ├── temperature: number
│ ├── humidity: number
│ ├── stock: number
│ └── last_update: string

/alerts
├── {alert_id}
│ ├── machineId: string
│ ├── message: string
│ └── timestamp: string

/history
├── {log_id}
│ ├── machineId: string
│ ├── temperature: number
│ ├── humidity: number
│ ├── stock: number
│ └── timestamp: string


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

| Perintah                  | Fungsi                                |
| ------------------------- | ------------------------------------- |
| `npm run start`           | Menjalankan autoAlert & backend penuh |
| `npm run test-connection` | Tes koneksi Firebase                  |
| `npm run login`           | Coba login user/admin                 |
| `npm run register`        | Tambah user baru ke Firebase          |
| `npm run clear`           | Hapus data di database                |