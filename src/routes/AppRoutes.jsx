import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Layouts
import DashboardLayout from "../layouts/DashboardLayout";
import UserLayout from "../layouts/UserLayout";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import UserPage from "../pages/admin/UserPage";
import LaporanPage from "../pages/admin/LaporanPage";
import ActivityPage from "../pages/admin/ActivityPage";
import ImplementasiForm from "../pages/forms/ImplementasiForm";
import MonitoringForm from "../pages/forms/MonitoringForm";

// User pages
import DashboardUser from "../pages/user/DashboardUser";
import PerencanaanForm from "../pages/forms/PerencanaanForm";

// Public pages
import LandingPage from "../pages/LandingPage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Verifikasi from "../pages/Verifikasi";
import About from "../pages/About";

// Protected Route
const ProtectedRoute = ({ role, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children ? children : <Outlet />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/verifikasi" element={<Verifikasi />} />

      {/* Admin */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="perencanaan" element={<PerencanaanForm />} />
          <Route path="implementasi" element={<ImplementasiForm />} />
          <Route path="monitoring" element={<MonitoringForm />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      {/* User */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route path="/user" element={<UserLayout />}>
          <Route path="dashboard" element={<DashboardUser />} />
          <Route path="perencanaan" element={<PerencanaanForm />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}