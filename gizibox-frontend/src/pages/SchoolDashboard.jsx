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
import { app } from "../firebaseConfig"; // pastikan export { app } di firebaseConfig

// NOTE: image used in UI preview (you uploaded) -> local path provided for developer tooling
// image path: /mnt/data/3ac95e79-8fbc-46e1-b771-8fd78737e09d.png

const db = getDatabase(app);

export default function SchoolDashboard() {

  
  // user
  const [user, setUser] = useState(null); // { uid, email, machineId, ... }
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  // lists & data
  const [machinesList, setMachinesList] = useState([]); // array of { machineId, meta... }
  const [status, setStatus] = useState({});
  const [stockInfo, setStockInfo] = useState({});
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [refillHistory, setRefillHistory] = useState([]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState(null); // 'createMachine'|'setInitial'|'updateStudents'|'refill'|'stats'|'alerts'|'refillHistory'
  const [loading, setLoading] = useState(false);

  // forms
  const [createName, setCreateName] = useState("");
  const [createSchoolName, setCreateSchoolName] = useState("");
  const [createStudentCount, setCreateStudentCount] = useState("");
  const [createRequiredStock, setCreateRequiredStock] = useState("");

  const [initialStudentCount, setInitialStudentCount] = useState("");
  const [newStudentCount, setNewStudentCount] = useState("");
  const [refillAmount, setRefillAmount] = useState("");
  const [refillNotes, setRefillNotes] = useState("");

  // === Format tanggal & jam lengkap ===
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


  // load user from localStorage (or from auth context if you have)
  useEffect(() => {
    const stored = localStorage.getItem("gizibox_user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      // if user already has machineId, we can select it; otherwise leave null
      if (u.machineId) setSelectedMachineId(u.machineId);
    }
  }, []);

  // load machines owned by user (from users/{uid}/machineIds OR fallback to query by owner_uid)
  useEffect(() => {
    if (!user?.uid) return;

    const uid = user.uid;
    // Try to read users/{uid}/machineIds first
    get(ref(db, `users/${uid}/machineIds`))
      .then((snap) => {
        if (snap.exists()) {
          const node = snap.val(); // { machine_1: true, machine_2: true }
          const ids = Object.keys(node || {});
          if (ids.length === 0) {
            // fallback to querying machines by owner_uid
            return queryMachinesByOwner(uid);
          }
          return Promise.all(
            ids.map(async (mid) => {
              const s = await get(ref(db, `machines/${mid}`));
              return s.exists() ? { machineId: mid, ...s.val() } : null;
            })
          ).then((arr) => arr.filter(Boolean));
        } else {
          // fallback
          return queryMachinesByOwner(uid);
        }
      })
      .then((list) => {
        setMachinesList(list || []);
        // auto-select first machine if none selected
        if (!selectedMachineId && (list || []).length > 0) {
          setSelectedMachineId(list[0].machineId);
        }
      })
      .catch((err) => {
        console.error("Failed load user machines:", err);
      });
  }, [user]);

  // helper: query machines by owner_uid
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

  // realtime listeners for selected machine
  useEffect(() => {
    if (!selectedMachineId) return;

    // status
    const statusRef = ref(db, `machines/${selectedMachineId}/status`);
    const unsubStatus = onValue(statusRef, (snap) => setStatus(snap.exists() ? snap.val() : {}));

    // stock_info
    const stockRef = ref(db, `machines/${selectedMachineId}/stock_info`);
    const unsubStock = onValue(stockRef, (snap) => setStockInfo(snap.exists() ? snap.val() : {}));

    // history (telemetry)
    const histRef = ref(db, "history");
    const unsubHist = onValue(histRef, (snap) => {
      if (!snap.exists()) {
        setHistory([]);
        return;
      }
      const all = snap.val();
      const filtered = Object.values(all)
        .filter((h) => h.machineId === selectedMachineId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);
      setHistory(filtered);
    });

    // alerts
    const alertsRef = ref(db, "alerts");
    const unsubAlerts = onValue(alertsRef, (snap) => {
      if (!snap.exists()) {
        setAlerts([]);
        return;
      }
      const all = snap.val();
      const filtered = Object.entries(all)
        .filter(([_, a]) => a.machineId === selectedMachineId)
        .map(([id, a]) => ({ id, ...a }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAlerts(filtered);
    });

    // refill_history
    const refillRef = ref(db, "refill_history");
    const unsubRefill = onValue(refillRef, (snap) => {
      if (!snap.exists()) {
        setRefillHistory([]);
        return;
      }
      const all = snap.val();
      const filtered = Object.entries(all)
        .filter(([_, r]) => r.machineId === selectedMachineId)
        .map(([id, r]) => ({ id, ...r }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRefillHistory(filtered);
    });

    return () => {
      unsubStatus();
      unsubStock();
      unsubHist();
      unsubAlerts();
      unsubRefill();
    };
  }, [selectedMachineId]);

  // CREATE MACHINE (frontend writes full machine node)
  const handleCreateMachine = async () => {
    if (!user?.uid) return alert("User tidak tersedia (login diperlukan).");
    if (!createName?.trim() && !createSchoolName?.trim()) {
      return alert("Isi setidaknya nama mesin atau nama sekolah.");
    }
    setLoading(true);
    try {
      // generate machineId similar to backend
      const rnd = Math.random().toString(36).slice(2, 6);
      const mid = `vm_${Date.now().toString(36)}_${rnd}`;

      const now = new Date().toISOString();
      const studentCount = createStudentCount ? Number(createStudentCount) : (createRequiredStock ? Number(createRequiredStock) : 0);
      const requiredStock = createRequiredStock ? Number(createRequiredStock) : undefined;

      const machineData = {
        owner_uid: user.uid,
        school_info: {
          school_name: createSchoolName || null,
          school_id: mid,
          student_count: typeof studentCount === "number" ? studentCount : 0,
          last_updated: now,
        },
        meta: {
          name: createName || null,
          required_stock: requiredStock ?? null,
          created_at: now,
          updated_at: now,
        },
        config: {
          polling_interval: 5000,
        },
        status: {
          current_stock: typeof studentCount === "number" ? studentCount : 0,
          temperature: 0,
          humidity: 0,
          last_update: now,
        },
        stock_info: {
          initial_stock: typeof studentCount === "number" ? studentCount : 0,
          current_stock: typeof studentCount === "number" ? studentCount : 0,
          last_refill: now,
          last_updated: now,
        },
      };

      // write machine node
      await set(ref(db, `machines/${mid}`), machineData);

      // link to user: users/{uid}/machineIds/{mid} = true
      await set(ref(db, `users/${user.uid}/machineIds/${mid}`), true);

      // also update machine.owner_uid explicitly (redundant but explicit)
      await update(ref(db, `machines/${mid}`), { owner_uid: user.uid });

      // refresh machines list
      const newList = [...machinesList, { machineId: mid, ...machineData }];
      setMachinesList(newList);
      // auto-select newly created
      setSelectedMachineId(mid);

      setCreateName("");
      setCreateSchoolName("");
      setCreateStudentCount("");
      setCreateRequiredStock("");
      setModal(null);
      alert("Machine berhasil dibuat dan di-link ke akun Anda.");
    } catch (err) {
      console.error("Create machine failed:", err);
      alert("Gagal membuat mesin: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ACTIONS: Set initial stock, update student count, refill (similar to earlier)
  const handleSetInitialStock = async () => {
    if (!selectedMachineId) return alert("Pilih mesin terlebih dahulu.");
    if (!initialStudentCount || Number(initialStudentCount) <= 0) return alert("Masukkan jumlah siswa (lebih dari 0).");
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const count = Number(initialStudentCount);
      await set(ref(db, `machines/${selectedMachineId}/stock_info`), {
        initial_stock: count,
        current_stock: count,
        student_count: count,
        used_stock: 0,
        usage_percentage: 0,
        last_refill: now,
        last_updated: now,
      });
      await update(ref(db, `machines/${selectedMachineId}/status`), { stock: count, last_update: now });
      await update(ref(db, `machines/${selectedMachineId}/school_info`), { student_count: count, last_updated: now });
      alert("Stok awal berhasil diset.");
      setModal(null);
      setInitialStudentCount("");
    } catch (err) {
      console.error(err);
      alert("Gagal set stok awal: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudentCount = async () => {
    if (!selectedMachineId) return alert("Pilih mesin terlebih dahulu.");
    if (!newStudentCount || Number(newStudentCount) < 0) return alert("Masukkan jumlah siswa yang valid.");
    setLoading(true);
    try {
      const now = new Date().toISOString();
      await update(ref(db, `machines/${selectedMachineId}/stock_info`), { student_count: Number(newStudentCount), last_updated: now });
      await update(ref(db, `machines/${selectedMachineId}/school_info`), { student_count: Number(newStudentCount), last_updated: now });
      alert("Jumlah siswa berhasil diperbarui.");
      setModal(null);
      setNewStudentCount("");
    } catch (err) {
      console.error(err);
      alert("Gagal update jumlah siswa: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefill = async () => {
    if (!selectedMachineId) return alert("Pilih mesin terlebih dahulu.");
    if (!refillAmount || Number(refillAmount) <= 0) return alert("Masukkan jumlah refill (lebih dari 0).");
    setLoading(true);
    try {
      const amt = Number(refillAmount);
      const now = new Date().toISOString();
      const snap = await get(ref(db, `machines/${selectedMachineId}/stock_info`));
      if (!snap.exists()) {
        await set(ref(db, `machines/${selectedMachineId}/stock_info`), {
          initial_stock: amt,
          current_stock: amt,
          student_count: 0,
          last_refill: now,
          last_updated: now,
        });
      } else {
        const d = snap.val();
        const newTotal = (d.current_stock || 0) + amt;
        await update(ref(db, `machines/${selectedMachineId}/stock_info`), {
          current_stock: newTotal,
          initial_stock: newTotal,
          last_refill: now,
          last_updated: now,
        });
      }

      const newStatusStock = (await get(ref(db, `machines/${selectedMachineId}/stock_info`))).val()?.current_stock || 0;
      await update(ref(db, `machines/${selectedMachineId}/status`), { stock: newStatusStock, last_update: now });

      const pushRef = push(ref(db, `refill_history`));
      await set(pushRef, { machineId: selectedMachineId, refill_amount: amt, new_total: newStatusStock, notes: refillNotes || "", timestamp: now, type: "refill" });

      alert("Refill berhasil.");
      setModal(null);
      setRefillAmount("");
      setRefillNotes("");
    } catch (err) {
      console.error(err);
      alert("Gagal refill: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // compute stats
  function computeStatistics(si = {}) {
    if (!si || !si.initial_stock) return null;
    const initial = Number(si.initial_stock || 0);
    const current = Number(si.current_stock || 0);
    const used = initial - current;
    const usagePerc = initial > 0 ? (used / initial) * 100 : 0;
    const lastRefill = si.last_refill ? new Date(si.last_refill) : null;
    const daysActive = lastRefill ? Math.max(1, Math.ceil((Date.now() - lastRefill.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const avgDaily = daysActive > 0 ? used / daysActive : 0;
    const estimatedDaysRemaining = avgDaily > 0 ? Math.ceil(current / avgDaily) : null;
    return {
      initial,
      current,
      used,
      usage_percentage: parseFloat(usagePerc.toFixed(2)),
      days_active: daysActive,
      avg_daily_usage: parseFloat(avgDaily.toFixed(2)),
      estimated_days_remaining: estimatedDaysRemaining,
    };
  }

  const stats = computeStatistics(stockInfo);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const modalTitle = {
    createMachine: "Buat Mesin Baru",
    setInitial: "Set Stok Awal (Jumlah Siswa)",
    updateStudents: "Update Jumlah Siswa",
    refill: "Refill Stok MBG",
    stats: "Statistik Stok",
    alerts: "Alerts Mesin",
    refillHistory: "Riwayat Refill",
  }[modal];

  // UI helpers
  const renderMachineListItem = (m) => {
    const active = m.machineId === selectedMachineId;
    return (
      <div
        key={m.machineId}
        className={`machine-item${active ? " active" : ""}`}
        onClick={() => setSelectedMachineId(m.machineId)}
        title={m.meta?.name || m.school_info?.school_name || m.machineId}
        style={{ cursor: "pointer", padding: "10px", borderRadius: 8, marginBottom: 6, background: active ? "rgba(255,255,255,0.12)" : "transparent" }}
      >
        <div style={{ fontWeight: 700 }}>{m.meta?.name || m.school_info?.school_name || m.machineId}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{m.machineId}</div>
      </div>
    );
  };

  return (
    <>
      <div className="layout">
        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="brand">GiziBox</div>

          <button className="btn create-btn" onClick={() => setModal("createMachine")}>+ Create Machine</button>

          <div style={{ height: 12 }} />

          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Your Machines</div>
          <div style={{ overflowY: "auto", maxHeight: "60vh", paddingRight: 6 }}>
            {machinesList.length === 0 ? (
              <div className="muted">Belum ada mesin. Buat mesin baru.</div>
            ) : (
              machinesList.map(renderMachineListItem)
            )}
          </div>

          <button className="collapse-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "⇤" : "⇥"}</button>
        </div>

        {/* MAIN */}
        <div className="dashboard-user">
          <div className="header">
            <h1 className="title">Dashboard Sekolah</h1>

            <div className="user-section">
              <div className="avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <span className="user-info">{user?.email}</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          </div>

          {/* ACTION BAR (placed where you marked) */}
          <div className="action-bar">
            <button className="btn blue-btn" onClick={() => setModal("setInitial")}>Set Stok Awal</button>
            <button className="btn" onClick={() => setModal("updateStudents")}>Update Jumlah Siswa</button>
            <button className="btn green-btn" onClick={() => setModal("refill")}>Refill</button>
            <button className="btn" onClick={() => setModal("stats")}>Lihat Statistik</button>
            <button className="btn outline" onClick={() => setModal("alerts")}>Alerts</button>
            <button className="btn outline" onClick={() => setModal("refillHistory")}>Riwayat Refill</button>
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
              <div className="label">Stok</div>
              <div className="value">{stockInfo.current_stock ?? "—"}</div>
            </div>

            <div className="card orange">
              <div className="icon">⏱</div>
              <div className="label">Last Update</div>
<div className="value">{formatDateTimeFull(status.last_update)}</div>
            </div>
          </div>

          {/* STOCK INFO */}
          <div className="section">
            <h2 className="section-title">📦 Stock Info</h2>
            <div className="info-grid">
              <div>Initial Stock: <strong>{stockInfo.initial_stock ?? "—"}</strong></div>
              <div>Current Stock: <strong>{stockInfo.current_stock ?? "—"}</strong></div>
              <div>Jumlah Siswa: <strong>{stockInfo.student_count ?? "—"}</strong></div>
              <div>Terpakai: <strong>{stockInfo.used_stock ?? (stockInfo.initial_stock ? stockInfo.initial_stock - (stockInfo.current_stock||0) : "—")}</strong></div>
              <div>Usage %: <strong>{stockInfo.usage_percentage ?? (stockInfo.initial_stock ? ( ((stockInfo.initial_stock - (stockInfo.current_stock||0)) / stockInfo.initial_stock) * 100 ).toFixed(2) : "—")}%</strong></div>
            </div>
          </div>

          {/* HISTORY */}
          <div className="history-card">
            <div className="history-title">📜 Riwayat Data</div>
            <ul className="history-list">
              {history.length === 0 ? (
                <li className="muted">Tidak ada history.</li>
              ) : (
                history.map((item, i) => (
                  <li key={i}>
<span className="time">{formatDateTimeFull(item.timestamp)}</span>
                    &nbsp; — Stok {item.stock ?? "—"}, Suhu {item.temperature ?? "—"}°C
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{modalTitle}</h3>
              <button className="close-x" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* CREATE MACHINE */}
              {modal === "createMachine" && (
                <>
                  <p>Buat mesin baru dan hubungkan ke akun Anda.</p>
                  <input className="input" placeholder="Nama mesin (opsional)" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                  <input className="input" placeholder="Nama sekolah" value={createSchoolName} onChange={(e) => setCreateSchoolName(e.target.value)} />
                  <input className="input" placeholder="Jumlah siswa (opsional)" value={createStudentCount} onChange={(e) => setCreateStudentCount(e.target.value)} />
                  <input className="input" placeholder="Required stock (opsional)" value={createRequiredStock} onChange={(e) => setCreateRequiredStock(e.target.value)} />
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setModal(null)}>Batal</button>
                    <button className="btn blue-btn" onClick={handleCreateMachine} disabled={loading}>{loading ? "Membuat..." : "Buat Mesin"}</button>
                  </div>
                </>
              )}

              {/* SET INITIAL */}
              {modal === "setInitial" && (
                <>
                  <p>Set stok awal (jumlah siswa) untuk mesin terpilih.</p>
                  <input className="input" type="number" placeholder="Jumlah siswa" value={initialStudentCount} onChange={(e) => setInitialStudentCount(e.target.value)} />
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setModal(null)}>Batal</button>
                    <button className="btn blue-btn" onClick={handleSetInitialStock} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</button>
                  </div>
                </>
              )}

              {/* UPDATE STUDENTS */}
              {modal === "updateStudents" && (
                <>
                  <p>Update jumlah siswa (tidak mengubah stock saat ini).</p>
                  <input className="input" type="number" placeholder="Jumlah siswa baru" value={newStudentCount} onChange={(e) => setNewStudentCount(e.target.value)} />
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setModal(null)}>Batal</button>
                    <button className="btn blue-btn" onClick={handleUpdateStudentCount} disabled={loading}>{loading ? "Menyimpan..." : "Update"}</button>
                  </div>
                </>
              )}

              {/* REFILL */}
              {modal === "refill" && (
                <>
                  <p>Refill stok MBG untuk mesin ini.</p>
                  <input className="input" type="number" placeholder="Jumlah refill" value={refillAmount} onChange={(e) => setRefillAmount(e.target.value)} />
                  <input className="input" placeholder="Catatan (opsional)" value={refillNotes} onChange={(e) => setRefillNotes(e.target.value)} />
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setModal(null)}>Batal</button>
                    <button className="btn green-btn" onClick={handleRefill} disabled={loading}>{loading ? "Memproses..." : "Refill"}</button>
                  </div>
                </>
              )}

              {/* STATS */}
              {modal === "stats" && (
                <>
                  <p>Statistik penggunaan stok.</p>
                  {!stats ? <p className="muted">Belum ada data stok.</p> : (
                    <div className="stats-grid">
                      <div>Initial: <strong>{stats.initial}</strong></div>
                      <div>Current: <strong>{stats.current}</strong></div>
                      <div>Used: <strong>{stats.used}</strong></div>
                      <div>Usage %: <strong>{stats.usage_percentage}%</strong></div>
                      <div>Days active: <strong>{stats.days_active}</strong></div>
                      <div>Avg/day: <strong>{stats.avg_daily_usage}</strong></div>
                      <div>Est days remaining: <strong>{stats.estimated_days_remaining ?? "—"}</strong></div>
                    </div>
                  )}
                  <div className="modal-actions"><button className="btn" onClick={() => setModal(null)}>Tutup</button></div>
                </>
              )}

              {/* ALERTS */}
              {modal === "alerts" && (
                <>
                  {alerts.length === 0 ? <p className="muted">Tidak ada alert.</p> : alerts.map(a => (
                    <div key={a.id} className={`alert-row alert-${a.priority || "normal"}`}>
                      <div className="alert-msg">{a.message}</div>
<div className="alert-meta">{a.type} — {formatDateTimeFull(a.timestamp)}</div>
                    </div>
                  ))}
                  <div className="modal-actions"><button className="btn" onClick={() => setModal(null)}>Tutup</button></div>
                </>
              )}

              {/* REFILL HISTORY */}
              {modal === "refillHistory" && (
                <>
                  {refillHistory.length === 0 ? <p className="muted">Tidak ada riwayat refill.</p> : refillHistory.map(r => (
                    <div key={r.id} className="refill-row">
                      <div>+{r.refill_amount} → Total: {r.new_total}</div>
<small className="muted">{formatDateTimeFull(r.timestamp)} {r.notes ? `— ${r.notes}` : ""}</small>
                    </div>
                  ))}
                  <div className="modal-actions"><button className="btn" onClick={() => setModal(null)}>Tutup</button></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        * { box-sizing: border-box; }
        .layout { display: flex; min-height: 100vh; }

        /* SIDEBAR */
        .sidebar { width: 260px; background:#1e3a8a; color: white; border-radius: 12px; padding: 18px; margin: 16px; height: calc(100vh - 32px); transition: width 0.25s; flex-shrink: 0; }
        .create-btn { width:100%; padding:10px; border-radius:8px; background:#fff; color:#1e3a8a; font-weight:700; border:none; cursor:pointer; margin-bottom:10px; }
        .brand { font-size:20px; font-weight:700; margin-bottom:12px; }
        .collapse-btn { margin-top: 12px; background:#fff; color:#1e3a8a; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; position:relative; left:0; }

        /* MAIN area */
        .dashboard-user { flex: 1; min-height: 100vh; background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%); padding: 30px; font-family: "Poppins", sans-serif; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .title { font-size:26px; font-weight:700; color:#1e3a8a; }
        .user-section { display:flex; align-items:center; gap:12px; }
        .avatar { background:#dbeafe; color:#1e3a8a; width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-weight:600; }
        .logout-btn { background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; }

        .action-bar { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0 18px 0; }
        .btn { padding:8px 14px; border-radius:10px; background:#fff; border:1px solid #e6eefc; cursor:pointer; }
        .blue-btn { background:#2563eb; color:white; border:none; }
        .green-btn { background:#16a34a; color:white; border:none; }
        .outline { background:transparent; border:1px dashed #cbd5e1; }

        .cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:20px; margin-bottom: 18px; }
        .card { background:white; border-radius:16px; padding:18px; text-align:center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .label { color:#6b7280; font-size:13px; margin-bottom:6px; }
        .value { font-size:22px; font-weight:600; }
        .blue .value { color: #2563eb; }
        .green .value { color: #16a34a; }
        .cyan .value { color: #0891b2; }
        .orange .value { color: #d97706; }

        .section { background:white; padding:16px; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); margin-bottom:16px; }
        .section-title { font-size:16px; font-weight:600; margin-bottom:10px; }
        .info-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; }

        .history-card { background:white; padding:16px; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); margin-top:12px; }
        .history-title { font-size:18px; font-weight:600; margin-bottom:8px; }
        .history-list { list-style:none; padding:0; margin:0; }
        .history-list li { padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:14px; color:#374151; }
        .time { color:#6b7280; font-size:12px; margin-right:8px; }
        .muted { color:#9ca3af; font-style:italic; }

        /* modal */
        .modal-backdrop { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(10,20,40,0.45); backdrop-filter: blur(6px); z-index:60; padding:24px; }
        .modal-card { width:920px; max-width: calc(100% - 48px); background: rgba(255,255,255,0.98); border-radius:14px; box-shadow: 0 20px 60px rgba(8,15,30,0.45); overflow:hidden; }
        .modal-header { display:flex; justify-content:space-between; align-items:center; padding:18px 20px; border-bottom:1px solid #eef2ff; }
        .modal-body { padding:18px 20px; max-height:70vh; overflow:auto; }
        .input { display:block; width:100%; padding:10px 12px; border-radius:10px; border:1px solid #e6eefc; margin:8px 0 12px 0; }
        .modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:10px; }

        .alert-row { padding:10px; border-radius:8px; background:#fff7ed; margin-bottom:8px; border:1px solid #ffedd5; }
        .alert-row.alert-critical { background:#fee2e2; border:1px solid #fecaca; }
        .alert-msg { font-weight:600; color:#92400e; }
        .alert-meta { font-size:12px; color:#92400e; opacity:0.9; }

        .stats-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; }
        .refill-row { padding:10px 0; border-bottom:1px solid #f3f4f6; }

        @media (max-width:900px) {
          .sidebar { display:none; }
          .layout { flex-direction:column; }
          .dashboard-user { padding:16px; }
          .modal-card { width:100%; max-width:720px; }
        }
      `}</style>
    </>
  );
}
