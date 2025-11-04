// src/components/ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('[ProtectedRoute] Checking access:', {
    isAuthenticated,
    loading,
    userRole: user?.role,
    requiredRole: role
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner show={true} message="Memverifikasi akses..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    console.log('[ProtectedRoute] Role mismatch, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] Access granted');
  return children;
}
