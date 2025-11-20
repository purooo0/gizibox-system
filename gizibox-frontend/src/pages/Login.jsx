import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const backendBase = import.meta?.env?.VITE_BACKEND_URL || "http://localhost:3000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // LOGIN KE FIREBASE AUTH
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // Ambil profil user dari backend (role, dsb)
      const meRes = await fetch(`${backendBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const me = await meRes.json();

      // Jika school, ambil mesin milik user (ambil satu untuk UI saat ini)
      let machineId = undefined;
      if (me?.role === "school") {
        const mineRes = await fetch(`${backendBase}/api/machines/mine`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (mineRes.ok) {
          const mine = await mineRes.json();
          const machines = mine?.machines || {};
          const keys = Object.keys(machines);
          if (keys.length > 0) machineId = keys[0];
        }
      }

      // SIMPAN USER + token + machineId (jika ada) DI LOCALSTORAGE
      const stored = {
        uid: user.uid,
        email: user.email,
        token: idToken,
        role: me?.role,
        machineId,
      };
      localStorage.setItem("gizibox_user", JSON.stringify(stored));


      // REDIRECT KE DASHBOARD SESUAI ROLE
      if (me?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/school/dashboard");
      }
    } catch (err) {
      setError("Email atau password salah!");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login GiziBox</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="school@gizibox.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <p style={styles.footerText}>
          Belum punya akun? <a href="/register">Daftar di sini</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#e8f0ff",
    fontFamily: "Inter, sans-serif",
  },
  card: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "14px",
    boxShadow: "0 12px 25px rgba(0, 0, 0, 0.08)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#1d4ed8",
    fontWeight: "700",
  },
  error: {
    background: "#fee",
    color: "#c00",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "1rem",
    textAlign: "center",
    fontSize: "0.9rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "0.9rem",
    marginBottom: "0.3rem",
  },
  input: {
    padding: "0.7rem 0.8rem",
    marginBottom: "1rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "0.9rem 0",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "0.2s",
  },
  footerText: {
    marginTop: "1rem",
    textAlign: "center",
    fontSize: "0.9rem",
  },
};
