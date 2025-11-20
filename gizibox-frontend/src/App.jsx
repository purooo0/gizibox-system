import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import SchoolDashboard from "./pages/SchoolDashboard.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminRoute from "./auth/AdminRoute.jsx";
import SchoolRoute from "./auth/SchoolRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/school/dashboard"
          element={
            <SchoolRoute>
              <SchoolDashboard />
            </SchoolRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
