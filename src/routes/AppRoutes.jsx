import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const PerencanaanForm = lazy(() => import('../pages/forms/PerencanaanForm'));
const ImplementasiForm = lazy(() => import('../pages/forms/ImplementasiForm'));
const MonitoringForm = lazy(() => import('../pages/forms/MonitoringForm'));

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route
          path="/perencanaan"
          element={isAuthenticated ? <PerencanaanForm /> : <Navigate to="/login" />}
        />
        <Route
          path="/implementasi"
          element={isAuthenticated ? <ImplementasiForm /> : <Navigate to="/login" />}
        />
        <Route
          path="/monitoring"
          element={isAuthenticated ? <MonitoringForm /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;