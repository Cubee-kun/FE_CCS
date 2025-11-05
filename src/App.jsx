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
import { BlockchainProvider } from "./contexts/BlockchainContext";

function AppContent() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const noNavbarRoutes = ["/login", "/register", "/admin", "/user"];
  const alwaysShowNavbarRoutes = ["/", "/about", "/contact", "/verifikasi"];
  
  const isNoNavbarRoute = noNavbarRoutes.some(route => location.pathname.startsWith(route));
  const isAlwaysShowNavbar = alwaysShowNavbarRoutes.some(route => {
    if (route === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(route);
  });

  const showNavbar = isAlwaysShowNavbar || (!isNoNavbarRoute && !isAuthenticated);

  console.log('[App] Render state:', {
    path: location.pathname,
    isAuthenticated,
    loading,
    showNavbar,
    timestamp: new Date().toISOString()
  });

  // ✅ Show loading only on initial mount, not on refresh
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
      <BlockchainProvider>
        <AppContent />
      </BlockchainProvider>
    </AuthProvider>
  );
}

export default App;
