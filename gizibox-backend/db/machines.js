import admin from "firebase-admin";

export async function updateMachineStatus(machineId, data) {
  await admin.database().ref(`machines/${machineId}/status`).update(data);
}

export async function getMachineData(machineId) {
  const snapshot = await admin.database().ref(`machines/${machineId}`).get();
  return snapshot.val();
}

// Create a machine with initial structure
export async function createMachine(machineId, { owner_uid = null, school_info = {}, config = {}, status = {}, meta = {} } = {}) {
  const now = new Date().toISOString();
  // Auto-generate machineId if not provided
  if (!machineId) {
    const rnd = Math.random().toString(36).slice(2, 6);
    machineId = `vm_${Date.now().toString(36)}_${rnd}`;
  }
  const { name = null, required_stock = null } = meta || {};
  const initialRequired = typeof required_stock === "number" ? required_stock : undefined;
  const todayFiveAM = (() => {
    const d = new Date();
    d.setHours(5, 0, 0, 0);
    return d.toISOString();
  })();
  const initialData = {
    owner_uid,
    school_info: {
      school_name: school_info.school_name || null,
      school_id: school_info.school_id || null,
      student_count: typeof school_info.student_count === "number" ? school_info.student_count : (initialRequired ?? 0),
      last_updated: now,
    },
    meta: {
      name,
      required_stock: initialRequired ?? null,
      created_at: now,
      updated_at: now,
    },
    config: {
      polling_interval: config.polling_interval || 5000,
      ...config,
    },
    status: {
      current_stock: typeof status.current_stock === "number"
        ? status.current_stock
        : (typeof status.stock === "number" ? status.stock : (initialRequired ?? 0)),
      temperature: typeof status.temperature === "number" ? status.temperature : 0,
      humidity: typeof status.humidity === "number" ? status.humidity : 0,
      last_update: now,
    },
    stock_info: {
      // initial_stock mengikuti school_info.student_count
      initial_stock: (typeof school_info.student_count === "number" ? school_info.student_count : (initialRequired ?? 0)),
      // current_stock mirror status.current_stock
      current_stock: typeof status.current_stock === "number"
        ? status.current_stock
        : (typeof status.stock === "number" ? status.stock : (initialRequired ?? 0)),
      last_refill: todayFiveAM,
    },
  };
  await admin.database().ref(`machines/${machineId}`).set(initialData);
  return { machineId, ...initialData };
}

// Update machine metadata (not for telemetry/status streaming)
export async function updateMachineInfo(machineId, { owner_uid, school_info, config, meta } = {}) {
  const updates = {};
  if (owner_uid !== undefined) updates["owner_uid"] = owner_uid;
  if (school_info) {
    updates["school_info"] = {
      ...(school_info || {}),
      last_updated: new Date().toISOString(),
    };
  }
  if (config) {
    updates["config"] = {
      ...(config || {}),
    };
  }
  if (meta) {
    updates["meta"] = {
      ...(meta || {}),
      updated_at: new Date().toISOString(),
    };
    if (typeof meta.required_stock === "number") {
      const now = new Date().toISOString();
      // Hapus legacy status/stock dan set current_stock saja
      updates["status/stock"] = null;
      updates["status/current_stock"] = meta.required_stock;
      updates["status/last_update"] = now;
      // Update stock_info sesuai aturan baru
      updates["stock_info/initial_stock"] = meta.required_stock; // mengikuti school_info.student_count (sinkron di bawah)
      updates["stock_info/current_stock"] = meta.required_stock; // mirror status.current_stock
      updates["stock_info/student_count"] = null; // dihapus
      updates["stock_info/last_updated"] = null; // dihapus
      // last_refill default jam 05:00 (hari ini)
      const five = new Date(); five.setHours(5,0,0,0);
      updates["stock_info/last_refill"] = five.toISOString();
      // Optionally, also keep school_info.student_count in sync if present
      if (!updates["school_info"]) updates["school_info"] = {};
      updates["school_info"].student_count = meta.required_stock;
      updates["school_info"].last_updated = now;
    }
  }
  if (Object.keys(updates).length === 0) return { machineId };
  await admin.database().ref(`machines/${machineId}`).update(updates);
  return { machineId, updates };
}

// Delete machine node
export async function deleteMachine(machineId) {
  await admin.database().ref(`machines/${machineId}`).remove();
  return { machineId, deleted: true };
}

// Set owner of a machine (one user can own many machines)
export async function setMachineOwner(machineId, ownerUid) {
  await admin.database().ref(`machines/${machineId}`).update({
    owner_uid: ownerUid,
  });
}

// Clear owner of a machine
export async function clearMachineOwner(machineId) {
  await admin.database().ref(`machines/${machineId}`).update({
    owner_uid: null,
  });
}

// Get all machines owned by a specific user
export async function getMachinesByOwner(ownerUid) {
  // Query by owner_uid using Admin SDK
  const qRef = admin.database().ref("machines").orderByChild("owner_uid").equalTo(ownerUid);
  const snapshot = await qRef.get();
  if (!snapshot.exists()) return {};
  return snapshot.val();
}