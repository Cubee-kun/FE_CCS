// src/App.jsx
import { useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/common/Navbar";
import ScrollToTop from "./components/common/ScrollToTop";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./assets/styles/index.css";

function AppContent() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Daftar path yang TIDAK menampilkan Navbar
  const noNavbarRoutes = ["/login", "/register", "/admin", "/user"];
  
  // Cek apakah di route yang tidak perlu navbar
  const isNoNavbarRoute = noNavbarRoutes.some(route => location.pathname.startsWith(route));

  // Tampilkan Navbar jika: Bukan di route yang tidak perlu navbar DAN user belum login
  const showNavbar = !isNoNavbarRoute && !isAuthenticated;

  // ✅ Debug logs
  console.log('[App] Render state:', {
    path: location.pathname,
    isAuthenticated,
    loading,
    isNoNavbarRoute,
    showNavbar,
    timestamp: new Date().toISOString()
  });

  // ✅ Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner show={true} message="Memuat aplikasi..." />;
  }

  return (
    <>
      <ScrollToTop />
      {showNavbar && <Navbar />}
      <AppRoutes />
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={true} 
        closeOnClick 
        pauseOnHover 
        draggable 
        theme="colored"
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
