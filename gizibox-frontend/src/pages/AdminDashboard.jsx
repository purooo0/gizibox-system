import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [users, setUsers] = useState({});
  const [machines, setMachines] = useState({});
  const [selectedSchool, setSelectedSchool] = useState(null);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // === Format tanggal lengkap ===
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

  // Load semua user & mesin
  useEffect(() => {
    const unsubUsers = onValue(ref(db, "users"), (snap) => {
      setUsers(snap.val() || {});
    });

    const unsubMachines = onValue(ref(db, "machines"), (snap) => {
      setMachines(snap.val() || {});
    });

    return () => {
      unsubUsers();
      unsubMachines();
    };
  }, []);

  // Filter hanya role school
  const schoolUsers = Object.entries(users).filter(
    ([, u]) => u?.role === "school"
  );

  // Mesin milik sekolah tertentu
  const schoolMachines =
    selectedSchool == null
      ? []
      : Object.entries(machines)
          .filter(([, m]) => m?.owner_uid === selectedSchool)
          .map(([mid, m]) => ({ mid, ...m }));

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">GiziBox Admin</div>

        <h3 className="sidebar-title">Daftar Sekolah</h3>

        <div className="school-list">
          {schoolUsers.length === 0 ? (
            <div className="muted">Tidak ada sekolah</div>
          ) : (
            schoolUsers.map(([uid, user]) => {
              const displayedName = user.school_name || user.email;
              return (
                <div
                  key={uid}
                  className={`school-item ${
                    selectedSchool === uid ? "active" : ""
                  }`}
                  onClick={() => setSelectedSchool(uid)}
                >
                  <div className="school-name">{displayedName}</div>
                  <div className="school-sub">{user.email}</div>
                </div>
              );
            })
          )}
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        {!selectedSchool ? (
          <div className="empty-state">
            <h2>Pilih sekolah dari sidebar</h2>
            <p>Anda dapat melihat semua mesin milik setiap sekolah.</p>
          </div>
        ) : (
          <div className="school-details">
            <h1 className="title">Informasi Sekolah</h1>

            {/* PROFIL SEKOLAH */}
            <div className="school-info-card">
              <h2>Profil Sekolah</h2>

              <p>
                <b>Nama Sekolah:</b>{" "}
                {users[selectedSchool]?.school_name || "(belum diisi)"}
              </p>

              <p><b>Email:</b> {users[selectedSchool]?.email}</p>

              <p><b>User ID:</b> {selectedSchool}</p>

              <p>
                <b>Dibuat Pada:</b>{" "}
                {formatDateTimeFull(users[selectedSchool]?.createdAt)}
              </p>

              <p><b>Total Mesin:</b> {schoolMachines.length}</p>
            </div>

            {/* MESIN */}
            <h2 className="section-title">Mesin Terdaftar</h2>

            {schoolMachines.length === 0 ? (
              <div className="muted">Sekolah ini belum memiliki mesin.</div>
            ) : (
              <div className="machine-grid">
                {schoolMachines.map((m) => {
                  const current = m?.status?.current_stock ?? "-";
                  const required = m?.status?.stock ?? "-";

                  return (
                    <div className="machine-card" key={m.mid}>
                      <h3 className="machine-title">
                        {m.meta?.name || m.school_info?.school_name || m.mid}
                      </h3>

                      <div className="machine-info">
                        <p><b>Machine ID:</b> {m.mid}</p>

                        <p>
                          <b>Stok:</b> {current} / {required}
                        </p>

                        <p><b>Suhu:</b> {m?.status?.temperature ?? "-"} °C</p>

                        <p><b>Kelembapan:</b> {m?.status?.humidity ?? "-"} %</p>

                        <p>
                          <b>Last Update:</b>{" "}
                          {formatDateTimeFull(m?.status?.last_update)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CSS */}
      <style>{`
        .admin-layout {
          display: flex;
          height: 100vh;
          font-family: "Poppins", sans-serif;
        }

        .sidebar {
          width: 260px;
          background: #1e3a8a;
          color: white;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .brand {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .sidebar-title {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .school-list {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .school-item {
          padding: 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          margin-bottom: 10px;
          cursor: pointer;
          transition: 0.2s;
        }

        .school-item:hover {
          background: rgba(255,255,255,0.15);
        }

        .school-item.active {
          background: rgba(255,255,255,0.25);
        }

        .school-name {
          font-weight: 600;
        }

        .school-sub {
          font-size: 12px;
          opacity: 0.8;
        }

        .logout-btn {
          background: #ef4444;
          border: none;
          padding: 10px;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          margin-top: auto;
        }

        .main {
          flex: 1;
          padding: 30px;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
          overflow-y: auto;
        }

        .empty-state {
          text-align: center;
          padding-top: 100px;
          color: #475569;
        }

        .title {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 20px;
        }

        .school-info-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 20px;
          margin-bottom: 12px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .machine-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .machine-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .machine-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 12px;
        }

        .machine-info p {
          margin: 5px 0;
          color: #475569;
        }

        .muted {
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
