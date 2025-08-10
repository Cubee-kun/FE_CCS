// src/App.jsx
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import "./index.css";

function App() {
  const location = useLocation();

  // Daftar path dimana Navbar tidak ditampilkan
  const noNavbarRoutes = ["/login", "/register"];

  // Cek apakah current path ada di daftar noNavbarRoutes (mencakup kemungkinan query params)
  const hideNavbar = noNavbarRoutes.some((path) => location.pathname.startsWith(path));

  return (
    <AuthProvider>
      {!hideNavbar && <Navbar />}
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
