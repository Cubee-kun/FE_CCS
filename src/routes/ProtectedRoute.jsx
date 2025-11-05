// src/components/ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Checking access:', {
    isAuthenticated,
    loading,
    userRole: user?.role,
    requiredRole: role,
    currentPath: location.pathname
  });

  // ✅ Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner show={true} message="Memverifikasi akses..." />
      </div>
    );
  }

  // ✅ Redirect to login but save the intended location
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Check role authorization
  if (role && user?.role !== role) {
    console.log('[ProtectedRoute] Role mismatch, redirecting to appropriate dashboard');
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  console.log('[ProtectedRoute] Access granted, rendering protected content');
  return children;
}
