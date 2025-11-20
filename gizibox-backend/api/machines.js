import express from 'express';
import admin from 'firebase-admin';
import { get } from 'firebase/database';
import { ref } from 'firebase/database';
import { db } from '../firebaseConfig.js';
import { setMachineOwner, clearMachineOwner, getMachinesByOwner, createMachine, updateMachineInfo, deleteMachine } from '../db/machines.js';
import { findUserByEmail } from '../db/users.js';
import { addMachineToUser, removeMachineFromUser } from '../db/users.js';
import { logHistory } from '../db/history.js';

const router = express.Router();

// Verify Firebase ID token
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
    return res.status(401).json({ error: 'Tidak dapat mengautentikasi token', details: error.message });
  }
};

async function getUserRole(uid) {
  const snapshot = await admin.database().ref(`users/${uid}/role`).get();
  return snapshot.exists() ? snapshot.val() : null;
}

// Assign a machine to an owner (admin only)
router.post('/assign', verifyToken, async (req, res) => {
  try {
    const role = await getUserRole(req.user.uid);
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { machineId, ownerUid } = req.body;
    if (!machineId || !ownerUid) return res.status(400).json({ error: 'machineId dan ownerUid wajib' });

    await setMachineOwner(machineId, ownerUid);
    return res.json({ message: 'Berhasil assign owner', machineId, ownerUid });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Unassign a machine (admin only)
router.post('/unassign', verifyToken, async (req, res) => {
  try {
    const role = await getUserRole(req.user.uid);
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { machineId } = req.body;
    if (!machineId) return res.status(400).json({ error: 'machineId wajib' });

    await clearMachineOwner(machineId);
    return res.json({ message: 'Berhasil unassign owner', machineId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get machines for current user (owner)
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const machines = await getMachinesByOwner(uid);
    return res.json({ machines });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Admin get machines by owner uid; owner can view their own via param
router.get('/by-owner/:uid', verifyToken, async (req, res) => {
  try {
    const uidParam = req.params.uid;
    const requesterUid = req.user.uid;
    const requesterRole = await getUserRole(requesterUid);

    if (!(requesterRole === 'admin' || requesterUid === uidParam)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const machines = await getMachinesByOwner(uidParam);
    return res.json({ machines });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create machine (admin only)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const role = await getUserRole(requesterUid);

    let { machineId, owner_uid = null, owner_email = null, school_info = {}, config = {}, status = {}, meta = {} } = req.body || {};

    // Ownership rules:
    // - Admin: boleh tentukan owner_uid atau owner_email (opsional). Jika kosong, tidak di-set.
    // - School (non-admin): owner_uid dipaksa = requesterUid, abaikan owner_email/owner_uid dari body.
    if (role === 'admin') {
      if (!owner_uid && owner_email) {
        const user = await findUserByEmail(owner_email);
        if (!user) return res.status(404).json({ error: 'Owner email tidak ditemukan' });
        if (user.role !== 'school') return res.status(400).json({ error: 'Owner harus role school' });
        owner_uid = user.uid;
      }
      if (owner_uid) {
        const ownerSnap = await admin.database().ref(`users/${owner_uid}`).get();
        if (!ownerSnap.exists()) return res.status(404).json({ error: 'Owner uid tidak ditemukan' });
        const ownerData = ownerSnap.val();
        if (ownerData.role !== 'school') return res.status(400).json({ error: 'Owner harus role school' });
        // Fetch email from Auth (source of truth)
        const ownerAuth = await admin.auth().getUser(owner_uid);
        const ownerEmail = ownerAuth.email || ownerData.email || null;
        // Default school_info based on requirement
        const reqRequired = typeof (meta?.required_stock) === 'number' ? meta.required_stock : undefined;
        school_info = {
          school_name: school_info.school_name || ownerEmail,
          school_id: school_info.school_id || owner_uid,
          student_count: typeof school_info.student_count === 'number' ? school_info.student_count : (reqRequired ?? ownerData.student_count ?? 0)
        };
      }
    } else {
      // Non-admin creator
      owner_uid = requesterUid;
      const ownerSnap = await admin.database().ref(`users/${owner_uid}`).get();
      if (!ownerSnap.exists()) return res.status(404).json({ error: 'User tidak ditemukan' });
      const ownerData = ownerSnap.val();
      if (ownerData.role !== 'school') return res.status(403).json({ error: 'Hanya sekolah yang dapat membuat mesin' });
      // Fetch email from Auth (source of truth)
      const ownerAuth = await admin.auth().getUser(owner_uid);
      const ownerEmail = ownerAuth.email || ownerData.email || null;
      // Default school_info sesuai requirement
      const reqRequired = typeof (meta?.required_stock) === 'number' ? meta.required_stock : undefined;
      school_info = {
        school_name: school_info.school_name || ownerEmail,
        school_id: school_info.school_id || owner_uid,
        student_count: typeof school_info.student_count === 'number' ? school_info.student_count : (reqRequired ?? ownerData.student_count ?? 0)
      };
    }

    // If owner_uid is provided directly, validate role is school
    if (owner_uid) {
      const ownerSnap2 = await admin.database().ref(`users/${owner_uid}`).get();
      if (!ownerSnap2.exists()) return res.status(404).json({ error: 'Owner uid tidak ditemukan' });
      const ownerData2 = ownerSnap2.val();
      if (ownerData2.role !== 'school') return res.status(400).json({ error: 'Owner harus role school' });
    }

    const created = await createMachine(machineId, { owner_uid, school_info, config, status, meta });
    // Link ke user jika ada owner
    if (owner_uid) {
      await addMachineToUser(owner_uid, created.machineId);
    }
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update machine info (admin only)
router.patch('/:machineId', verifyToken, async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const role = await getUserRole(requesterUid);
    const { machineId } = req.params;
    const { owner_uid: new_owner_uid, school_info, config } = req.body || {};

    // Authorization: admin or owner
    const snapshot = await admin.database().ref(`machines/${machineId}/owner_uid`).get();
    const currentOwner = snapshot.exists() ? snapshot.val() : null;
    if (!(role === 'admin' || currentOwner === requesterUid)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only admin can change owner_uid
    const payload = {
      owner_uid: role === 'admin' ? new_owner_uid : undefined,
      school_info,
      config,
    };
    const updated = await updateMachineInfo(machineId, payload);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete machine (admin only)
router.delete('/:machineId', verifyToken, async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const role = await getUserRole(requesterUid);
    const { machineId } = req.params;

    // Authorization: admin or owner
    const snapshot = await admin.database().ref(`machines/${machineId}/owner_uid`).get();
    const currentOwner = snapshot.exists() ? snapshot.val() : null;
    if (!(role === 'admin' || currentOwner === requesterUid)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await deleteMachine(machineId);
    if (currentOwner) {
      await removeMachineFromUser(currentOwner, machineId);
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Post telemetry/status for a machine (admin or owner)
router.post('/:machineId/status', verifyToken, async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const role = await getUserRole(requesterUid);
    const { machineId } = req.params;
    let body = req.body;
    if (body === undefined || body === null) body = {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const rawTemp = body.temperature;
    const rawHum = body.humidity;
    const rawStock = body.stock;

    // Authorization: admin or owner
    const snapshot = await admin.database().ref(`machines/${machineId}/owner_uid`).get();
    const currentOwner = snapshot.exists() ? snapshot.val() : null;
    if (!(role === 'admin' || currentOwner === requesterUid)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date().toISOString();
    const temp = rawTemp === undefined || rawTemp === null ? undefined : Number(rawTemp);
    const hum = rawHum === undefined || rawHum === null ? undefined : Number(rawHum);
    const stk = rawStock === undefined || rawStock === null ? undefined : Number(rawStock);

    const payload = { last_update: now };
    if (Number.isFinite(temp)) payload.temperature = temp;
    if (Number.isFinite(hum)) payload.humidity = hum;
    if (Number.isFinite(stk)) {
      payload.stock = stk;
      payload.current_stock = stk; // mirror for frontend compatibility
    }

    await admin.database().ref(`machines/${machineId}/status`).update(payload);
    await logHistory(machineId, { ...payload });

    return res.json({ machineId, status: payload });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
