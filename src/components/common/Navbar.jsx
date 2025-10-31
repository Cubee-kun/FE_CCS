import { FiUser, FiSettings, FiLogOut, FiSun, FiMoon, FiCheckCircle } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext"; // tambahkan


export default function Navbar({ isUser = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme(); // gunakan ThemeContext

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="glass-effect border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur-md opacity-50"></div>
                <img
                  src="/images/sebumi.png"
                  alt="Sebumi Logo"
                  className="h-10 w-auto cursor-pointer relative z-10 drop-shadow-xl"
                  onClick={() => navigate("/")}
                />
              </motion.div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold premium-text">AgroPariwisata</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Conservation System</p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 md:space-x-3" ref={dropdownRef}>
              {!isAuthenticated ? (
                <>
                  <motion.button
                    onClick={() => navigate("/verifikasi")}
                    className="hidden sm:flex items-center space-x-2 glass-effect glass-hover px-4 py-2 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Verifikasi</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => navigate("/login")}
                    className="glass-effect glass-hover px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Login
                  </motion.button>
                  
                  <motion.button
                    onClick={() => navigate("/register")}
                    className="hidden lg:inline premium-gradient text-white px-4 py-2 rounded-xl text-sm font-medium shadow-premium"
                    whileHover={{ scale: 1.05, boxShadow: "0 25px 80px -15px rgba(16, 185, 129, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Up
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => navigate("/verifikasi")}
                    className="hidden md:flex items-center space-x-2 premium-gradient text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Verifikasi</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 glass-effect glass-hover px-3 py-2 rounded-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-8 h-8 rounded-full premium-gradient flex items-center justify-center text-white text-sm font-medium shadow-lg">
                      {(user?.username || user?.name || "U")[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] md:max-w-[150px] truncate">
                      {user?.username || user?.name || "User"}
                    </span>
                  </motion.button>
                  
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-64 glass-effect rounded-2xl shadow-2xl overflow-hidden"
                      >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {user?.email || user?.username}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            {user?.role || "User"}
                          </p>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Verifikasi - Mobile only */}
                          <motion.button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/verifikasi");
                            }}
                            className="md:hidden flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                            whileHover={{ x: 4 }}
                          >
                            <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-medium">Verifikasi</span>
                          </motion.button>
                          
                          {/* Theme Toggle */}
                          <motion.button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                            whileHover={{ x: 4 }}
                          >
                            {theme === "dark" ? (
                              <>
                                <FiSun className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium">Light Mode</span>
                              </>
                            ) : (
                              <>
                                <FiMoon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                <span className="text-sm font-medium">Dark Mode</span>
                              </>
                            )}
                          </motion.button>
                          
                          {/* Settings */}
                          <motion.button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/settings");
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                            whileHover={{ x: 4 }}
                          >
                            <FiSettings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">Settings</span>
                          </motion.button>
                          
                          {/* Logout */}
                          <motion.button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 border-t border-white/10 mt-2"
                            whileHover={{ x: 4 }}
                          >
                            <FiLogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}