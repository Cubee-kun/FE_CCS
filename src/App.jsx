// src/App.jsx
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/common/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./assets/styles/index.css";

function App() {
  const location = useLocation();

  // Daftar path dimana Navbar tidak ditampilkan
  const noNavbarRoutes = ["/", "/login", "/register"];

  // Cek apakah current path ada di daftar noNavbarRoutes
  const hideNavbar = noNavbarRoutes.includes(location.pathname);

  return (
    <AuthProvider>
      {!hideNavbar && <Navbar />}
      <AppRoutes />
      {/* 👉 container notifikasi, bisa dipasang sekali di root */}
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
    </AuthProvider>
  );
}

export default App;
