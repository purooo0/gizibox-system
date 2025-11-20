import React, { useEffect, useState } from "react";
import { subscribeMachineStatus, subscribeToHistory } from "../db/read";

export default function SchoolDashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [machineId, setMachineId] = useState("");
  const [status, setStatus] = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("gizibox_user");
    if (stored) {
      const user = JSON.parse(stored);
      setUserEmail(user.email);
      setMachineId(user.machineId);
    }
  }, []);

  useEffect(() => {
    if (!machineId) return;

    const unsubStatus = subscribeMachineStatus(machineId, (data) => {
      setStatus(data || {});
    });

    const unsubHistory = subscribeToHistory(machineId, (data) => {
      setHistory(data || []);
    });

    return () => {
      unsubStatus();
      unsubHistory();
    };
  }, [machineId]);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      <div className="dashboard-user">
        <div className="header">
          <h1 className="title">Dashboard Sekolah</h1>

          <div className="user-section">
            <div className="avatar">{userEmail?.[0]?.toUpperCase()}</div>
            <span className="user-info">{userEmail}</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>

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
            <div className="value">{status.current_stock ?? "—"}</div>
          </div>

          <div className="card orange">
            <div className="icon">⏱</div>
            <div className="label">Last Update</div>
            <div className="value">{status.last_update ?? "—"}</div>
          </div>
        </div>

        <div className="history-card">
          <div className="history-title">📜 Riwayat Data</div>
          <ul className="history-list">
            {history.length === 0 ? (
              <li className="muted">Tidak ada history.</li>
            ) : (
              history.map((item, i) => (
                <li key={i}>
                  <span className="time">{item.timestamp?.substring(11, 16)}</span>
                  Stok {item.stock}, suhu {item.temperature}°C
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <style>{`
        .dashboard-user {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
          padding: 30px;
          font-family: "Poppins", sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .title {
          font-size: 26px;
          font-weight: 700;
          color: #1e3a8a;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          background: #dbeafe;
          color: #1e3a8a;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 600;
        }

        .logout-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .value {
          font-size: 22px;
          font-weight: 600;
        }

        .blue .value { color: #2563eb; }
        .green .value { color: #16a34a; }
        .cyan .value { color: #0891b2; }
        .orange .value { color: #d97706; }

        .history-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .history-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .history-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .history-list li {
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 15px;
        }

        .muted {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </>
  );
}