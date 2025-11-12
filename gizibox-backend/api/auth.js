// api/auth.js
import express from 'express';
import { loginUser } from '../auth/loginUser.js';
import { registerUser } from '../auth/registerUser.js';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig.js';
import { ref, get } from 'firebase/database';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccountPath = join(__dirname, '../serviceAccountKey.json');

if (!existsSync(serviceAccountPath)) {
  console.error('❌ ERROR: serviceAccountKey.json not found!');
  console.log('\n🔧 Cara membuat service account key:');
  console.log('1. Buka Firebase Console: https://console.firebase.google.com/');
  console.log('2. Pilih project Anda');
  console.log('3. Klik ikon ⚙️ > Project settings');
  console.log('4. Pilih tab "Service accounts"');
  console.log('5. Klik "Generate new private key"');
  console.log('6. Simpan file JSON yang didownload sebagai "serviceAccountKey.json" di folder project\n');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Error reading service account:', error.message);
  process.exit(1);
}

// Inisialisasi Admin SDK jika belum ada
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://gizibox-xxxxx.firebaseio.com' // Ganti dengan URL database Anda
  });
}

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'school' } = req.body;
    const user = await registerUser(email, password, role);
    if (!user) {
      return res.status(400).json({ error: 'Gagal mendaftar' });
    }
    res.status(201).json({ 
      message: 'Pendaftaran berhasil', 
      uid: user.uid,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    // Dapatkan ID token untuk autentikasi
    const idToken = await auth.currentUser.getIdToken();
    res.json({ 
      message: 'Login berhasil',
      token: idToken,
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    await signOut(auth);
    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware untuk verifikasi token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak valid. Format: Bearer <token>' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      error: 'Tidak dapat mengautentikasi token',
      details: error.message 
    });
  }
};

// Cek user yang sedang login
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    
    // Ambil data tambahan dari database
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Data user tidak ditemukan' });
    }
    
    const userData = snapshot.val();
    
    res.json({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      role: userData.role,
      ...userData
    });
  } catch (error) {
    console.error('Error in /me:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      details: error.message 
    });
  }
});

export default router;
