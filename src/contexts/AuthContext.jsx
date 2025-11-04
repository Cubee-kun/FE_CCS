import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);
  const initRef = useRef(false); // ✅ Prevent double initialization

  // Fungsi untuk menyetel timer refresh token
  const setRefreshTimer = (token) => {
    try {
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
    } catch (error) {
      console.error('[AuthContext] Error setting refresh timer:', error);
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

  // ✅ Cek token saat pertama kali load - with proper initialization
  useEffect(() => {
    // Prevent double initialization in React.StrictMode
    if (initRef.current) return;
    initRef.current = true;

    const checkAuth = () => {
      const token = localStorage.getItem("token");
      
      console.log('[AuthContext] Initial check - token:', token ? 'exists' : 'null');
      
      if (token) {
        try {
          const decoded = jwtDecode(token);
          console.log('[AuthContext] Token decoded:', decoded);
          
          // Check if token is expired
          if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            console.log('[AuthContext] Token expired, logging out');
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
          } else {
            console.log('[AuthContext] Token valid, user authenticated');
            setUser(decoded);
            setIsAuthenticated(true);
            setRefreshTimer(token);
          }
        } catch (error) {
          console.error('[AuthContext] Error decoding token:', error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('[AuthContext] No token, user not authenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
      
      // ✅ Set loading false after all checks
      setLoading(false);
    };
    
    checkAuth();

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, []); // Empty dependency array

  // Fungsi login
  const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);
      const token = response.data?.access_token;
      const userData = response.data?.user;

      if (!token) throw new Error("Token tidak ditemukan di response.");

      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      const mergedUser = { ...decoded, ...(userData || {}) };
      
      // ✅ Update state in correct order
      setUser(mergedUser);
      setIsAuthenticated(true);
      setRefreshTimer(token);

      console.log('[AuthContext] Login successful:', mergedUser);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
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
    console.log('[AuthContext] Logging out');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
  };

  // ✅ Debug log dengan useEffect terpisah
  useEffect(() => {
    console.log('[AuthContext] State updated:', {
      isAuthenticated,
      user: user?.username || user?.email || user?.name || 'none',
      loading,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, user, loading]);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
