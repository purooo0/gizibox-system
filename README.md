# GiziBox System

GiziBox System adalah aplikasi monitoring vending machine makanan bergizi untuk lingkungan sekolah. Sistem ini menggabungkan dashboard web, API backend, Firebase Authentication, dan Firebase Realtime Database untuk memantau stok, suhu, kelembapan, alert mesin, serta riwayat operasional.

Project ini disusun sebagai monorepo sederhana dengan dua aplikasi utama:

- `gizibox-frontend`: dashboard React untuk admin dan sekolah.
- `gizibox-backend`: Express API, integrasi Firebase, monitoring, dan utilitas IoT.

## Highlights

- Role-based dashboard untuk admin dan sekolah.
- Login dan register menggunakan Firebase Authentication.
- Manajemen mesin, assignment owner sekolah, stok, dan jumlah siswa.
- Monitoring status mesin: stok, suhu, kelembapan, dan last update.
- Alert otomatis untuk kondisi seperti stok rendah, suhu tinggi, atau mesin offline.
- Riwayat data mesin dan refill berbasis Firebase Realtime Database.

## Tech Stack

- Frontend: React, Vite, React Router, Recharts, Firebase Web SDK.
- Backend: Node.js, Express, Firebase Admin SDK, Firebase Web SDK.
- Database: Firebase Realtime Database.
- Auth: Firebase Authentication.

## Struktur Repository

```text
gizibox-system/
├── gizibox-backend/
│   ├── api/              # Express route handlers
│   ├── auth/             # Auth helper scripts
│   ├── db/               # Firebase database operations
│   ├── iot/              # IoT data sender/clear utilities
│   ├── middleware/       # Auth and role middleware
│   ├── monitoring/       # Auto alert monitoring process
│   ├── test/             # Manual integration test scripts
│   ├── .env.example      # Backend environment template
│   └── server.js         # API entry point
├── gizibox-frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── auth/         # Route guards and auth helpers
│   │   ├── db/           # Firebase read helpers
│   │   └── pages/        # Login, register, admin, school dashboards
│   └── .env.example      # Frontend environment template
└── README.md
```

## Getting Started

### 1. Clone dan install dependencies

```bash
git clone <repository-url>
cd gizibox-system

cd gizibox-backend
npm install

cd ../gizibox-frontend
npm install
```

### 2. Siapkan Firebase

Buat Firebase project dengan Authentication dan Realtime Database aktif. Setelah itu:

- Salin `gizibox-backend/.env.example` menjadi `gizibox-backend/.env`.
- Salin `gizibox-frontend/.env.example` menjadi `gizibox-frontend/.env`.
- Isi semua konfigurasi Firebase sesuai project kamu.
- Untuk backend, simpan service account JSON sebagai `gizibox-backend/serviceAccountKey.json` atau isi `FIREBASE_SERVICE_ACCOUNT`.

File `.env` dan service account tidak boleh di-commit ke repository publik.

### 3. Jalankan backend

```bash
cd gizibox-backend
npm run dev
```

API berjalan di `http://localhost:3000`.

### 4. Jalankan frontend

```bash
cd gizibox-frontend
npm run dev
```

Dashboard berjalan di URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Scripts

Backend:

```bash
npm run dev              # Jalankan Express API dengan nodemon
npm run api              # Jalankan Express API dengan node
npm start                # Jalankan proses monitoring auto alert
npm run test-connection  # Tes koneksi Firebase
npm run test-dashboard   # Tes fungsi dashboard
```

Frontend:

```bash
npm run dev      # Jalankan Vite dev server
npm run build    # Build production
npm run lint     # Jalankan ESLint
npm run preview  # Preview hasil build
```

## Dokumentasi Tambahan

- [Backend README](./gizibox-backend/README.md)
- [Frontend README](./gizibox-frontend/README.md)
- [Stock Management](./gizibox-backend/STOCK_MANAGEMENT.md)
- [User Flow](./gizibox-backend/USER_FLOW.md)
- [Dokumentasi Backend](./gizibox-backend/dokumentasi.md)

## Security Notes

Repository ini sudah disiapkan agar aman untuk publik:

- Firebase config dibaca dari environment variables.
- `serviceAccountKey.json`, `.env`, `dist/`, `node_modules/`, dan file OS seperti `.DS_Store` masuk `.gitignore`.
- Jangan commit private key, token, credential Firebase Admin, atau build output lokal.

Jika credential pernah terlanjur masuk git history, revoke key tersebut dari Firebase Console dan buat key baru sebelum repository dipublikasikan.
