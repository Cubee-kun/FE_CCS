import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);
  const initRef = useRef(false);

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

  // ✅ Enhanced initial check with proper auth persistence
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      console.log('[AuthContext] Initial check:', { 
        hasToken: !!token, 
        hasSavedUser: !!savedUser 
      });
      
      if (token) {
        try {
          const decoded = jwtDecode(token);
          
          // Check if token is expired
          if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            console.log('[AuthContext] Token expired, logging out');
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // ✅ Merge decoded token with saved user data
            const mergedUser = savedUser 
              ? { ...decoded, ...JSON.parse(savedUser) }
              : decoded;
            
            console.log('[AuthContext] Token valid, restoring session:', mergedUser);
            setUser(mergedUser);
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
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const response = await api.post("/login", {
        ...credentials,
        deviceInfo,
        forceLogout: credentials.forceLogout || false,
      });

      const token = response.data?.access_token;
      const userData = response.data?.user;

      if (!token) throw new Error("Token tidak ditemukan di response.");

      // ✅ Save both token and user data
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      const mergedUser = { ...decoded, ...(userData || {}) };
      
      // ✅ Persist user data for page refresh
      localStorage.setItem("user", JSON.stringify(mergedUser));
      
      setUser(mergedUser);
      setIsAuthenticated(true);
      setRefreshTimer(token);

      console.log('[AuthContext] Login successful, session saved:', mergedUser);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      
      // ✅ Handle device conflict error
      if (error.response?.status === 409 || error.response?.data?.code === 'DEVICE_CONFLICT') {
        return {
          success: false,
          code: 'DEVICE_CONFLICT',
          message: error.response?.data?.message || "Akun sudah login di perangkat lain",
          sessionInfo: error.response?.data?.sessionInfo || {
            lastDevice: error.response?.data?.lastDevice || 'Perangkat lain',
            lastLogin: error.response?.data?.lastLogin || 'Baru saja',
            ipAddress: error.response?.data?.ipAddress || 'Unknown',
          }
        };
      }

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
