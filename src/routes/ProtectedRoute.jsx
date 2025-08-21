// src/components/ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    // Bisa diganti loading spinner juga
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Kalau belum login, redirect ke login
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Kalau role tidak sesuai, redirect ke landing atau halaman lain
    return <Navigate to="/" replace />;
  }

  // Kalau sudah login dan role sesuai, render komponen anaknya
  return children;
}
