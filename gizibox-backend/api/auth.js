// api/auth.js
import express from 'express';
import { loginUser } from '../auth/loginUser.js';
import { registerUser } from '../auth/registerUser.js';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : join(__dirname, '../serviceAccountKey.json');

  if (!existsSync(serviceAccountPath)) {
    throw new Error(
      'Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT in gizibox-backend/.env.'
    );
  }

  return JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
    databaseURL: process.env.FIREBASE_DATABASE_URL
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
    
    // Ambil data tambahan dari database menggunakan Admin SDK (melewati rules client)
    const adminUserRef = admin.database().ref(`users/${user.uid}`);
    const snapshot = await adminUserRef.get();
    
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
