import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const stored = localStorage.getItem("gizibox_user");
  const user = stored ? JSON.parse(stored) : {};
  if (!user?.uid) return <Navigate to="/" replace />;
  if (user?.role !== "admin") return <Navigate to="/school/dashboard" replace />;
  return children;
}
