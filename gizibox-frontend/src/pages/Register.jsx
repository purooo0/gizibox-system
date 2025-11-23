import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getDatabase, ref, set } from "firebase/database";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState(""); // ➜ input baru
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!schoolName.trim()) {
      setErrorMsg("Nama sekolah wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const db = getDatabase();

      await set(ref(db, "users/" + userCredential.user.uid), {
        email,
        role: "school",         // FIXED: selalu school
        school_name: schoolName,
        machineIds: {},         // optional: kosong di awal
        createdAt: new Date().toISOString(),
      });

      alert("Akun sekolah berhasil dibuat!");
      navigate("/");
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Daftar Akun Sekolah</h1>

        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          
          {/* NAMA SEKOLAH */}
          <label style={styles.label}>Nama Sekolah</label>
          <input
            type="text"
            style={styles.input}
            placeholder="contoh: SDN 01 Jakarta"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
          />

          {/* EMAIL */}
          <label style={styles.label}>Email</label>
          <input
            type="email"
            style={styles.input}
            placeholder="sekolah@gizibox.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* PASSWORD */}
          <label style={styles.label}>Password</label>
          <input
            type="password"
            style={styles.input}
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p style={styles.footerText}>
          Sudah punya akun?{" "}
          <span style={styles.link} onClick={() => navigate("/")}>
            Login
          </span>
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
    maxWidth: "420px",
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
  buttonDisabled: {
    backgroundColor: "#93a5c6",
    cursor: "not-allowed",
  },
  footerText: {
    marginTop: "1rem",
    textAlign: "center",
    fontSize: "0.9rem",
  },
  link: {
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
  },
};
