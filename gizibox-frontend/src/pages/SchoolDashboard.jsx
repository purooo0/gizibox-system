// /src/pages/SchoolDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getDatabase,
  ref,
  onValue,
  get,
  set,
  update,
  push,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { app } from "../firebaseConfig";

const db = getDatabase(app);

export default function SchoolDashboard() {
  // user
  const [user, setUser] = useState(null);
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  // lists & data
  const [machinesList, setMachinesList] = useState([]);
  const [status, setStatus] = useState({});
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  // removed refillHistory per request

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);

  // forms
  const [createName, setCreateName] = useState("");
  const [createSchoolName, setCreateSchoolName] = useState("");
  const [createStudentCount, setCreateStudentCount] = useState("");
  const [createRequiredStock, setCreateRequiredStock] = useState("");

  const [newStudentCount, setNewStudentCount] = useState("");
  const [refillAmount, setRefillAmount] = useState("");
  const [refillNotes, setRefillNotes] = useState("");

  // helpers
  function formatDateTimeFull(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const waktu = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${hari}, ${tanggal}, ${waktu}`;
  }

  // load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("gizibox_user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.machineId) setSelectedMachineId(u.machineId);
    }
  }, []);

  // load machine list (either from users/{uid}/machineIds or query machines by owner)
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;

    get(ref(db, `users/${uid}/machineIds`))
      .then(async (snap) => {
        if (!snap.exists()) return [];
        const node = snap.val();
        const ids = Object.keys(node || {});
        if (ids.length === 0) return queryMachinesByOwner(uid);

        const list = await Promise.all(
          ids.map(async (mid) => {
            const s = await get(ref(db, `machines/${mid}`));
            return s.exists() ? { machineId: mid, ...s.val() } : null;
          })
        );
        return list.filter(Boolean);
      })
      .then((list) => {
        setMachinesList(list || []);
        if (!selectedMachineId && list.length > 0) {
          setSelectedMachineId(list[0].machineId);
        } else if (selectedMachineId) {
          const found = list.find((m) => m.machineId === selectedMachineId);
          if (!found && list.length > 0) setSelectedMachineId(list[0].machineId);
        }
      })
      .catch((err) => console.error("Failed load machines:", err));
  }, [user]); // intentionally only depends on user

  async function queryMachinesByOwner(uid) {
    try {
      const q = query(ref(db, "machines"), orderByChild("owner_uid"), equalTo(uid));
      const snap = await get(q);
      if (!snap.exists()) return [];
      const val = snap.val();
      return Object.entries(val).map(([id, data]) => ({ machineId: id, ...data }));
    } catch (err) {
      console.error("Query machines by owner failed:", err);
      return [];
    }
  }

  /**
   * evaluateAlerts
   * - memastikan alert ada ketika kondisi terpenuhi
   * - menghapus alert yang tidak lagi relevan
   *
   * Logika:
   *  - tentukan desiredTypes (array string) berdasarkan status terbaru
   *  - ambil daftar alert sekarang di /alerts untuk machineId
   *  - push alert baru untuk setiap desiredType yang belum ada
   *  - hapus alert yang ada tetapi tidak di desiredTypes
   */
  async function evaluateAlerts(machineId, status) {
    if (!machineId || !status) return;

    const now = new Date().toISOString();
    const desired = [];

    // stok rendah: status.stock = required_stock, status.current_stock = real
    if (
      typeof status.stock === "number" &&
      typeof status.current_stock === "number" &&
      status.stock > 0 &&
      status.current_stock / status.stock < 0.2
    ) {
      desired.push("low_stock");
    }

    // suhu tinggi
    if (typeof status.temperature === "number" && status.temperature >= 40) {
      desired.push("high_temp");
    }

    // offline: tidak update >5 menit
    if (status.last_update) {
      const last = new Date(status.last_update).getTime();
      const diff = (Date.now() - last) / 1000;
      if (diff > 300) {
        desired.push("offline");
      }
    }

    try {
      // ambil semua alert (kita akan filter client-side)
      const snap = await get(ref(db, "alerts"));
      const all = snap.exists() ? snap.val() : {};
      const entries = Object.entries(all); // [ [id, alertObj], ... ]

      // existing alerts for this machine: map type -> [id, ...]
      const existingByType = {};
      for (const [id, obj] of entries) {
        if (!obj) continue;
        if (obj.machineId !== machineId) continue;
        const t = obj.type;
        if (!existingByType[t]) existingByType[t] = [];
        existingByType[t].push({ id, obj });
      }

      // 1) create alerts that are desired but not existing
      for (const t of desired) {
        if (!existingByType[t] || existingByType[t].length === 0) {
          // push new alert
          const msg =
            t === "low_stock"
              ? `Stok sangat rendah (${status.current_stock}/${status.stock})`
              : t === "high_temp"
              ? `Suhu mesin terlalu tinggi (${status.temperature}°C)`
              : t === "offline"
              ? `Mesin tidak mengirim data (>5 menit)`
              : "Alert";

          await push(ref(db, "alerts"), {
            type: t,
            message: msg,
            machineId,
            timestamp: now,
          });
        } else {
          // if there are existing alerts of this type, do nothing (avoid duplicates)
        }
      }

      // 2) remove alerts that exist but are no longer desired
      for (const [t, list] of Object.entries(existingByType)) {
        if (!desired.includes(t)) {
          // remove all alerts of this type for this machine
          for (const it of list) {
            try {
              await set(ref(db, `alerts/${it.id}`), null);
            } catch (err) {
              console.error("Failed to remove alert", it.id, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("evaluateAlerts error:", err);
    }
  }

  // realtime: status, history, alerts
  useEffect(() => {
    if (!selectedMachineId) return;

    // STATUS subscription
    const statusRef = ref(db, `machines/${selectedMachineId}/status`);
    const unsubStatus = onValue(statusRef, (snap) => {
      if (!snap.exists()) {
        setStatus({});
        return;
      }
      const s = snap.val();
      setStatus(s);

      // evaluate alerts once per status update
      evaluateAlerts(selectedMachineId, s);
    });

    // HISTORY subscription: listen to "history" node and filter client-side, limit 10
    const histRef = ref(db, "history");
    const unsubHistory = onValue(histRef, (snap) => {
      if (!snap.exists()) {
        setHistory([]);
        return;
      }
      const all = snap.val();
      const arr = Object.values(all)
        .filter((h) => h.machineId === selectedMachineId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10); // limit to 10 latest
      setHistory(arr);
    });

    // ALERTS subscription: listen to all alerts, filter client-side
    const alertsRef = ref(db, "alerts");
    const unsubAlerts = onValue(alertsRef, (snap) => {
      if (!snap.exists()) {
        setAlerts([]);
        return;
      }
      const all = snap.val();
      const arr = Object.entries(all)
        .filter(([_, a]) => a.machineId === selectedMachineId)
        .map(([id, a]) => ({ id, ...a }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAlerts(arr);
    });

    // cleanup
    return () => {
      try {
        unsubStatus && unsubStatus();
      } catch (e) {}
      try {
        unsubHistory && unsubHistory();
      } catch (e) {}
      try {
        unsubAlerts && unsubAlerts();
      } catch (e) {}
    };
  }, [selectedMachineId]);

  // CREATE MACHINE
  const handleCreateMachine = async () => {
    if (!user?.uid) return alert("User tidak tersedia.");
    if (!createName.trim() && !createSchoolName.trim())
      return alert("Isi nama mesin atau nama sekolah.");

    const req = Number(createRequiredStock);
    if (isNaN(req) || req < 0) return alert("Isi Required Stock dengan angka valid.");

    setLoading(true);
    try {
      const rnd = Math.random().toString(36).slice(2, 6);
      const mid = `vm_${Date.now().toString(36)}_${rnd}`;
      const now = new Date().toISOString();
      const studentCount = Number(createStudentCount) || 0;

      const machineData = {
        owner_uid: user.uid,
        school_info: {
          school_name: createSchoolName || null,
          school_id: mid,
          student_count: studentCount,
          last_updated: now,
        },
        meta: {
          name: createName || null,
          created_at: now,
          updated_at: now,
        },
        config: { polling_interval: 5000 },
        status: {
          stock: req,
          current_stock: req,
          student_count: studentCount,
          temperature: 0,
          humidity: 0,
          last_update: now,
        },
      };

      await set(ref(db, `machines/${mid}`), machineData);
      await set(ref(db, `users/${user.uid}/machineIds/${mid}`), true);

      setMachinesList((prev) => [...prev, { machineId: mid, ...machineData }]);
      setSelectedMachineId(mid);

      setCreateName("");
      setCreateSchoolName("");
      setCreateStudentCount("");
      setCreateRequiredStock("");
      setModal(null);
      alert("Machine berhasil dibuat.");
    } catch (err) {
      alert("Gagal: " + (err?.message || err));
    }
    setLoading(false);
  };

  // UPDATE STUDENT COUNT
  const handleUpdateStudentCount = async () => {
    if (!selectedMachineId) return alert("Pilih mesin.");
    const v = Number(newStudentCount);
    if (isNaN(v) || v < 0) return alert("Jumlah siswa tidak valid.");

    setLoading(true);
    try {
      const now = new Date().toISOString();

      await update(ref(db, `machines/${selectedMachineId}/status`), {
        student_count: v,
        last_update: now,
      });
      await update(ref(db, `machines/${selectedMachineId}/school_info`), {
        student_count: v,
        last_updated: now,
      });

      setModal(null);
      setNewStudentCount("");
      alert("Jumlah siswa diperbarui.");
    } catch (err) {
      alert("Error: " + (err?.message || err));
    }
    setLoading(false);
  };

  // REFILL
  const handleRefill = async () => {
    if (!selectedMachineId) return alert("Pilih mesin.");
    const amt = Number(refillAmount);
    if (isNaN(amt) || amt <= 0) return alert("Jumlah refill harus > 0.");

    setLoading(true);
    try {
      const now = new Date().toISOString();

      const snap = await get(ref(db, `machines/${selectedMachineId}/status`));
      const prev = snap.exists() ? snap.val() : {};
      const newCurrent = Number(prev.current_stock || 0) + amt;

      await update(ref(db, `machines/${selectedMachineId}/status`), {
        current_stock: newCurrent,
        last_update: now,
      });

      // push snapshot to history
      const h = push(ref(db, "history"));
      await set(h, {
        machineId: selectedMachineId,
        current_stock: newCurrent,
        stock: prev.stock,
        temperature: prev.temperature,
        humidity: prev.humidity,
        timestamp: now,
      });

      // After refill, evaluateAlerts will run via status subscription and remove low_stock alert if condition cleared
      setModal(null);
      setRefillAmount("");
      setRefillNotes("");
      alert("Refill berhasil.");
    } catch (err) {
      alert("Error: " + (err?.message || err));
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      <div className="layout">
        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="brand">GiziBox</div>
          <button className="btn create-btn" onClick={() => setModal("createMachine")}>
            + Create Machine
          </button>

          <div style={{ height: 12 }} />

          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8, color: "white" }}>
            Your Machines
          </div>

          <div style={{ overflowY: "auto", maxHeight: "60vh", paddingRight: 6 }}>
            {machinesList.length === 0 ? (
              <div className="muted">Belum ada mesin.</div>
            ) : (
              machinesList.map((m) => (
                <div
                  key={m.machineId}
                  onClick={() => setSelectedMachineId(m.machineId)}
                  style={{
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: 8,
                    marginBottom: 6,
                    background:
                      selectedMachineId === m.machineId
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "white" }}>
                    {m.meta?.name || m.school_info?.school_name || m.machineId}
                  </div>
                  <div style={{ fontSize: 12, color: "white", opacity: 0.9 }}>
                    {m.machineId}
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="collapse-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "⇤" : "⇥"}
          </button>
        </div>

        {/* MAIN */}
        <div className="dashboard-user">
          <div className="header">
            <h1 className="title">Dashboard Sekolah</h1>

            <div className="user-section">
              <div className="avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <span className="user-info">{user?.email}</span>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="action-bar">
            <button className="btn" onClick={() => setModal("updateStudents")}>
              Update Jumlah Siswa
            </button>
            <button className="btn green-btn" onClick={() => setModal("refill")}>
              Refill
            </button>
          </div>

          {/* CARDS */}
          <div className="cards">
            <div className="card blue">
              <div className="icon">🌡️</div>
              <div className="label">Suhu</div>
              <div className="value">{status.temperature ?? "—"}°C</div>
            </div>

            <div className="card cyan">
              <div className="icon">💧</div>
              <div className="label">Kelembapan</div>
              <div className="value">{status.humidity ?? "—"}%</div>
            </div>

            <div className="card green">
              <div className="icon">📦</div>
              <div className="label">Stok Sekarang</div>
              <div className="value">
                {status.current_stock ?? "—"} / {status.stock ?? "—"}
              </div>
            </div>

            <div className="card purple">
              <div className="icon">👥</div>
              <div className="label">Jumlah Siswa</div>
              <div className="value">{status.student_count ?? "—"}</div>
            </div>

            <div className="card yellow">
              <div className="icon">⏱</div>
              <div className="label">Last Update</div>
              <div className="value">{formatDateTimeFull(status.last_update)}</div>
            </div>
          </div>

          {/* ALERTS */}
          <div className="section">
            <h2 className="section-title">⚠️ Alerts Mesin</h2>

            {alerts.length === 0 ? (
              <p className="muted">Tidak ada alert.</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="alert-row">
                  <div className="alert-msg">{a.message}</div>
                  <div className="alert-meta">
                    {a.type} — {formatDateTimeFull(a.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* HISTORY (10 latest) */}
          <div className="history-card">
            <div className="history-title">📜 Riwayat Data </div>

            <ul className="history-list">
              {history.length === 0 ? (
                <li className="muted">Tidak ada history.</li>
              ) : (
                history.map((item, i) => (
                  <li key={i}>
                    <span className="time">{formatDateTimeFull(item.timestamp)}</span>
                    {" — Stok "}
                    {item.current_stock ?? "—"} / {item.stock ?? "—"}
                    {", Suhu "}
                    {item.temperature ?? "—"}°C
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {modal === "createMachine"
                  ? "Buat Mesin Baru"
                  : modal === "updateStudents"
                  ? "Update Jumlah Siswa"
                  : modal === "refill"
                  ? "Refill Stok"
                  : ""}
              </h3>
              <button className="close-x" onClick={() => setModal(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* CREATE MACHINE */}
              {modal === "createMachine" && (
                <>
                  <input
                    className="input"
                    placeholder="Nama mesin"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Nama sekolah"
                    value={createSchoolName}
                    onChange={(e) => setCreateSchoolName(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Jumlah siswa"
                    value={createStudentCount}
                    onChange={(e) => setCreateStudentCount(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Required stock (stock)"
                    value={createRequiredStock}
                    onChange={(e) => setCreateRequiredStock(e.target.value)}
                  />

                  <div className="modal-actions">
                    <button className="btn" onClick={() => setModal(null)}>
                      Batal
                    </button>
                    <button
                      className="btn blue-btn"
                      disabled={loading}
                      onClick={handleCreateMachine}
                    >
                      {loading ? "Membuat..." : "Buat"}
                    </button>
                  </div>
                </>
              )}

              {/* UPDATE STUDENTS */}
              {modal === "updateStudents" && (
                <>
                  <input
                    className="input"
                    type="number"
                    placeholder="Jumlah siswa baru"
                    value={newStudentCount}
                    onChange={(e) => setNewStudentCount(e.target.value)}
                  />
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setModal(null)}>
                      Batal
                    </button>
                    <button
                      className="btn blue-btn"
                      disabled={loading}
                      onClick={handleUpdateStudentCount}
                    >
                      {loading ? "Menyimpan..." : "Update"}
                    </button>
                  </div>
                </>
              )}

              {/* REFILL */}
              {modal === "refill" && (
                <>
                  <input
                    className="input"
                    type="number"
                    placeholder="Jumlah refill"
                    value={refillAmount}
                    onChange={(e) => setRefillAmount(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Catatan (opsional)"
                    value={refillNotes}
                    onChange={(e) => setRefillNotes(e.target.value)}
                  />
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setModal(null)}>
                      Batal
                    </button>
                    <button
                      className="btn green-btn"
                      disabled={loading}
                      onClick={handleRefill}
                    >
                      {loading ? "Memproses..." : "Refill"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        * { box-sizing: border-box; }
        .layout { display: flex; min-height: 100vh; }

        /* SIDEBAR */
        .sidebar { width: 260px; background:#1e3a8a; color:white; border-radius:12px; padding:18px; margin:16px; height:calc(100vh - 32px); transition:0.25s; }
        .create-btn { width:100%; padding:10px; border-radius:8px; background:white; color:#1e3a8a; font-weight:700; border:none; cursor:pointer; }
        .brand { font-size:20px; font-weight:700; margin-bottom:12px; color:white; }
        .collapse-btn { margin-top:12px; background:white; color:#1e3a8a; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; }

        /* MAIN */
        .dashboard-user { flex:1; padding:30px; background:linear-gradient(180deg,#f8fbff,#eef4ff); font-family:"Poppins",sans-serif; }
        .header { display:flex; justify-content:space-between; align-items:center; }
        .title { font-size:26px; font-weight:700; color:#1e3a8a; }
        .user-section { display:flex; align-items:center; gap:12px; }
        .avatar { background:#dbeafe; width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#1e3a8a; font-weight:600; }
        .logout-btn { background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; }

        .action-bar { display:flex; gap:10px; margin:16px 0; flex-wrap:wrap; }
        .btn { padding:8px 14px; border-radius:10px; background:white; border:1px solid #e6eefc; cursor:pointer; }
        .blue-btn { background:#2563eb; color:white; border:none; }
        .green-btn { background:#16a34a; color:white; border:none; }

        /* CARDS */
        .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px; }
        .card { background:white; padding:18px; border-radius:16px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
        .label { font-size:13px; color:#6b7280; }
        .value { font-size:22px; font-weight:600; }
        .blue .value { color:#2563eb; }
        .cyan .value { color:#0891b2; }
        .green .value { color:#16a34a; }
        .purple .value { color:#6d28d9; }
        .yellow .value { color:#ca8a04; }

        /* SECTION */
        .section { background:white; padding:16px; border-radius:12px; margin-top:14px; box-shadow:0 4px 12px rgba(0,0,0,0.06); }
        .section-title { font-size:16px; font-weight:600; margin-bottom:8px; }
        .info-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }

        /* ALERTS */
        .alert-row { padding:10px; border-radius:8px; background:#fff7ed; border:1px solid #ffedd5; margin-bottom:8px; }
        .alert-msg { font-weight:700; color:#92400e; }
        .alert-meta { font-size:12px; color:#92400e; opacity:0.9; }

        /* HISTORY */
        .history-card { background:white; padding:16px; border-radius:12px; margin-top:14px; }
        .history-title { font-size:18px; font-weight:600; margin-bottom:8px; }
        .history-list { list-style:none; padding:0; margin:0; }
        .history-list li { padding:8px 0; border-bottom:1px solid #f1f5f9; }
        .time { font-size:12px; color:#6b7280; }
        .muted { color:#9ca3af; font-style:italic; }

        /* MODAL */
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.3); display:flex; justify-content:center; align-items:center; }
        .modal-card { width:600px; background:white; border-radius:12px; overflow:hidden; }
        .modal-header { padding:14px 18px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; }
        .modal-body { padding:18px; max-height:70vh; overflow:auto; }
        .input { width:100%; padding:10px; border-radius:8px; border:1px solid #e6eefc; margin:8px 0; }
        .modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:10px; }
        .close-x { background:none; border:none; font-size:20px; cursor:pointer; }

        @media(max-width:900px){
          .sidebar { display:none; }
        }
      `}</style>
    </>
  );
}
