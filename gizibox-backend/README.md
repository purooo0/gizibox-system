# GiziBox Backend

Backend GiziBox menangani API, autentikasi berbasis Firebase, manajemen mesin, monitoring stok, alert, dan utilitas pengiriman data IoT untuk vending machine makanan bergizi di sekolah.

## Fitur Utama

- Express API untuk auth dan manajemen mesin.
- Verifikasi Firebase ID token dengan Firebase Admin SDK.
- Role-based access untuk admin dan school.
- Assignment mesin ke sekolah.
- Monitoring stok, suhu, kelembapan, dan status update.
- Alert otomatis dan pencatatan history ke Firebase Realtime Database.
- Script utilitas untuk simulasi IoT, clear data, dan test koneksi.

## Struktur Direktori

```text
gizibox-backend/
├── api/             # Route Express: auth dan machines
├── auth/            # Script login/register/logout dan helper auth
├── db/              # Operasi database Firebase
├── iot/             # Simulasi kirim data dan clear data mesin
├── middleware/      # Auth guard dan role checker
├── monitoring/      # Proses auto alert
├── test/            # Script test manual/integrasi
├── firebaseConfig.js
├── rules.json
└── server.js
```

## Setup

```bash
cd gizibox-backend
npm install
cp .env.example .env
```

Isi `.env` dengan konfigurasi Firebase. Untuk Firebase Admin SDK, pilih salah satu:

- Simpan service account sebagai `serviceAccountKey.json` di folder `gizibox-backend`.
- Atau isi `FIREBASE_SERVICE_ACCOUNT` dengan JSON service account satu baris.

`serviceAccountKey.json` dan `.env` sudah di-ignore dan tidak boleh masuk repository publik.

## Menjalankan API

```bash
npm run dev
```

Endpoint utama:

```text
GET    /
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/machines/assign
POST   /api/machines/unassign
GET    /api/machines/mine
GET    /api/machines/by-owner/:uid
POST   /api/machines/create
PATCH  /api/machines/:machineId
DELETE /api/machines/:machineId
POST   /api/machines/:machineId/status
```

## Scripts

```bash
npm run dev              # API development server
npm run api              # API server dengan node
npm start                # Monitoring auto alert
npm run test-connection  # Test koneksi Firebase
npm run test-dashboard   # Test fungsi dashboard
npm run test-bugfix      # Test perbaikan bug tertentu
npm run login            # Script login manual
npm run register         # Script register manual
npm run clear            # Clear data lewat utilitas IoT
```

## Data Model Ringkas

```text
/users/{uid}
  email
  role
  machineIds

/machines/{machineId}
  owner_uid
  school_info
  config
  status

/alerts/{alertId}
  machineId
  type
  message
  timestamp

/history/{historyId}
  machineId
  temperature
  humidity
  stock
  timestamp
```

## Catatan Keamanan

- Firebase Admin service account adalah secret dan tidak boleh dipublikasikan.
- Gunakan environment variables untuk semua konfigurasi Firebase.
- Review `rules.json` sebelum production agar akses database sesuai role.
