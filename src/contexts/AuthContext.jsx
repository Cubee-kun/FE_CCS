import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  // Fungsi untuk menyetel timer refresh token
  const setRefreshTimer = (token) => {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return;

    const expiresInMs = decoded.exp * 1000 - Date.now();
    const refreshBeforeMs = expiresInMs - 60 * 1000; // refresh 1 menit sebelum expired

    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }

    if (refreshBeforeMs > 0) {
      refreshTimer.current = setTimeout(refreshToken, refreshBeforeMs);
    }
  };

  // Fungsi refresh token
  const refreshToken = async () => {
    try {
      const res = await api.post("/refresh");
      const newToken = res.data?.access_token;

      if (newToken) {
        localStorage.setItem("token", newToken);
        const decoded = jwtDecode(newToken);
        setUser(decoded);
        setIsAuthenticated(true);
        setRefreshTimer(newToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Gagal refresh token:", err);
      logout();
    }
  };

  // Cek token saat pertama kali load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            logout();
          } else {
            setUser(decoded);
            setIsAuthenticated(true);
            setRefreshTimer(token);
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, []);

  // Fungsi login
  const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);
      const token = response.data?.access_token;
      const userData = response.data?.user;

      if (!token) throw new Error("Token tidak ditemukan di response.");

      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      setUser({ ...decoded, ...(userData || {}) });
      setIsAuthenticated(true);
      setRefreshTimer(token);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Login gagal",
      };
    }
  };

  // Fungsi register
  const register = async (userData) => {
    try {
      await api.post("/register", userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registrasi gagal",
      };
    }
  };

  // Fungsi logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook untuk memanggil AuthContext
export const useAuth = () => useContext(AuthContext);
