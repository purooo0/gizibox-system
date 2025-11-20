import { Navigate } from "react-router-dom";

export default function SchoolRoute({ children }) {
  const stored = localStorage.getItem("gizibox_user");
  const user = stored ? JSON.parse(stored) : {};
  if (!user?.uid) return <Navigate to="/" replace />;
  if (user?.role !== "school") return <Navigate to="/admin/dashboard" replace />;
  return children;
}
