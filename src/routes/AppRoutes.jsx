import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import DashboardLayout from "../layouts/DashboardLayout";
import UserLayout from "../layouts/UserLayout";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import UserPage from "../pages/admin/UserPage";
import LaporanPage from "../pages/admin/LaporanPage";
import ActivityPage from "../pages/admin/ActivityPage";

// Forms
import PerencanaanForm from "../pages/forms/PerencanaanForm";
import ImplementasiForm from "../pages/forms/ImplementasiForm";
import MonitoringForm from "../pages/forms/MonitoringForm";

// User pages
import DashboardUser from "../pages/user/DashboardUser";

// Public pages
import LandingPage from "../pages/public/LandingPage";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Verifikasi from "../pages/public/Verifikasi";

// Auth pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Settings
import Settings from "../pages/settings/Settings";

// Protected Route
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";

function VerifikasiWrapper() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Public verifikasi page (tanpa layout)
    return <Verifikasi />;
  }

  // Authenticated verifikasi dengan layout sesuai role
  if (user?.role === "admin") {
    return (
      <DashboardLayout>
        <Verifikasi />
      </DashboardLayout>
    );
  }

  return (
    <UserLayout>
      <Verifikasi />
    </UserLayout>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Verifikasi - Public (untuk user yang belum login) */}
      <Route path="/verifikasi" element={<VerifikasiWrapper />} />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserPage />} />
        <Route path="laporan" element={<LaporanPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="perencanaan" element={<PerencanaanForm />} />
        <Route path="implementasi" element={<ImplementasiForm />} />
        <Route path="monitoring" element={<MonitoringForm />} />
        {/* ✅ Verifikasi route untuk admin */}
        <Route path="verifikasi" element={<Verifikasi />} />
        <Route path="settings" element={<Settings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* User */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute role="user">
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardUser />} />
        <Route path="perencanaan" element={<PerencanaanForm />} />
        {/* ✅ Verifikasi route untuk user */}
        <Route path="verifikasi" element={<Verifikasi />} />
        <Route path="settings" element={<Settings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}