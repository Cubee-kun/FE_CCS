import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Layouts
import DashboardLayout from "../layouts/DashboardLayout";
import UserLayout from "../layouts/UserLayout";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import UserPage from "../pages/admin/UserPage";
import LaporanPage from "../pages/admin/LaporanPage";
import ActivityPage from "../pages/admin/ActivityPage";

// User pages (shared forms)
import PerencanaanForm from "../pages/forms/PerencanaanForm";
import ImplementasiForm from "../pages/forms/ImplementasiForm";
import MonitoringForm from "../pages/forms/MonitoringForm";

// Public
import LandingPage from "../pages/LandingPage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import About from "../pages/About";

export default function AppRoutes() {
  const { user } = useAuth(); // misalnya { role: "admin" | "user" }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />

      {/* Admin Routes */}
      {user?.role === "admin" && (
        <Route path="/admin" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="perencanaan" element={<PerencanaanForm />} />
          <Route path="implementasi" element={<ImplementasiForm />} />
          <Route path="monitoring" element={<MonitoringForm />} />
        </Route>
      )}

      {/* User Routes */}
      {user?.role === "user" && (
        <Route path="/user" element={<UserLayout />}>
          <Route path="perencanaan" element={<PerencanaanForm />} />
          <Route path="implementasi" element={<ImplementasiForm />} />
          <Route path="monitoring" element={<MonitoringForm />} />
        </Route>
      )}

      {/* Fallback: kalau nggak cocok role */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
