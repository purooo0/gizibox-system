# GiziBox Frontend

Frontend GiziBox adalah dashboard React untuk memantau vending machine makanan bergizi. Aplikasi ini menyediakan halaman login/register, dashboard sekolah, dashboard admin, data mesin real-time, alert, serta riwayat status mesin.

## Fitur

- Login dan register sekolah dengan Firebase Authentication.
- Route guard untuk admin dan school.
- Dashboard sekolah untuk melihat mesin, stok, suhu, kelembapan, alert, dan history.
- Dashboard admin untuk pengawasan dan manajemen data.
- Integrasi backend API untuk profil user dan data mesin.
- Integrasi Firebase Realtime Database untuk data real-time.

## Struktur Direktori

```text
gizibox-frontend/
├── public/
├── src/
│   ├── api/          # Axios client
│   ├── auth/         # Protected route dan role guard
│   ├── db/           # Helper pembacaan Firebase
│   ├── pages/        # Login, register, dashboard admin/sekolah
│   ├── App.jsx       # Routing aplikasi
│   ├── firebaseConfig.js
│   ├── index.css
│   └── main.jsx
├── .env.example
├── index.html
└── vite.config.js
```

## Setup

```bash
cd gizibox-frontend
npm install
cp .env.example .env
```

Isi `.env` dengan Firebase Web App config dan URL backend lokal:

```text
VITE_BACKEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000
```

Semua environment variable yang dipakai Vite harus diawali `VITE_`.

## Development

```bash
npm run dev
```

Vite akan menampilkan URL lokal, biasanya `http://localhost:5173`.

## Build dan Quality Check

```bash
npm run build
npm run lint
npm run preview
```

## Routes

```text
/                 Login
/register         Register sekolah
/school/dashboard Dashboard sekolah
/admin/dashboard  Dashboard admin
```

## Catatan Publikasi

- Jangan commit `.env`.
- Jangan commit folder `dist/`; build ulang dengan `npm run build` saat deploy.
- Firebase Web config bukan service account, tetapi tetap lebih rapi jika dikelola lewat environment variables.
