import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

// Public pages
import LandingPage from "../pages/LandingPage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import About from "../pages/About";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import UserPage from "../pages/admin/UserPage";
import LaporanPage from "../pages/admin/LaporanPage";
import PerencanaanForm from "../pages/forms/PerencanaanForm";
import ImplementasiForm from "../pages/forms/ImplementasiForm";
import MonitoringForm from "../pages/forms/MonitoringForm";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />

      {/* Admin Routes (semua child di bawah DashboardLayout) */}
      <Route path="/admin" element={<DashboardLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserPage />} />
        <Route path="laporan" element={<LaporanPage />} />
        {/* Tambahkan child lain di sini jika perlu */}
      </Route>

      {/* Form routes (jika memang ingin di luar admin) */}
      <Route path="/perencanaan" element={<PerencanaanForm />} />
      <Route path="/implementasi" element={<ImplementasiForm />} />
      <Route path="/monitoring" element={<MonitoringForm />} />

      {/* 404 */}
      <Route path="*" element={<div>Halaman tidak ditemukan</div>} />
    </Routes>
  );
}