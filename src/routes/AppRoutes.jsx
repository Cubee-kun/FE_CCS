// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import DashboardUser from "../pages/user/DashboardUser";
import DashboardAdmin from "../pages/admin/Dashboard";
import LoginPage from "../pages/auth/Login";
import RegisterPage from "../pages/auth/Register";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/user/*" element={<DashboardUser />} />
      <Route path="/admin/*" element={<DashboardAdmin />} />
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}
