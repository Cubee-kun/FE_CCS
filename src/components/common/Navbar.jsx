import { FiUser, FiSettings, FiLogOut, FiSun, FiMoon, FiCheckCircle, FiMenu, FiX, FiHome, FiInfo, FiChevronRight } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "./LoadingSpinner";

export default function Navbar({ isUser = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navItems = [
    { name: "Beranda", path: "/", icon: FiHome, color: "emerald" },
    { name: "Tentang", path: "/about", icon: FiInfo, color: "blue" },
  ];

  const handleNavigation = (path) => {
    if (location.pathname === path) {
      setMobileMenuOpen(false);
      setDropdownOpen(false);
      return;
    }

    setNavigating(true);
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    
    setTimeout(() => {
      navigate(path);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      setTimeout(() => setNavigating(false), 300);
    }, 150);
  };

  return (
    <>
      {/* Loading Spinner */}
      <LoadingSpinner show={navigating} message="Memuat halaman..." size="normal" />

      {/* Main Header */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50" 
            : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <motion.div 
              className="flex items-center space-x-3 group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation("/")}
            >
              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full blur-xl opacity-30 group-hover:opacity-50"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.img
                    src="/images/icon.png"
                    alt="CCS-System Logo"
                    className="h-12 w-12 md:h-14 md:w-14 relative z-10 object-contain drop-shadow-2xl"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex flex-col">
                  <motion.h1 
                    className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight"
                    whileHover={{ scale: 1.05 }}
                  >
                    Sebumi
                  </motion.h1>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">
                    CCS - System
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all group ${
                    location.pathname === item.path
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {location.pathname === item.path && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      layoutId="activeNav"
                    />
                  )}
                </motion.button>
              ))}

              <motion.button
                onClick={() => handleNavigation("/verifikasi")}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>Verifikasi</span>
              </motion.button>

              {!isAuthenticated && (
                <motion.button
                  onClick={() => handleNavigation("/login")}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Masuk
                </motion.button>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <motion.button
                    onClick={toggleTheme}
                    className="hidden lg:block p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {theme === "dark" ? (
                      <FiSun className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <FiMoon className="w-4 h-4 text-gray-600" />
                    )}
                  </motion.button>

                  {/* Desktop User Dropdown */}
                  <div className="hidden lg:block relative" ref={dropdownRef}>
                    <motion.button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="relative">
                        <motion.div 
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          animate={{ 
                            boxShadow: dropdownOpen 
                              ? "0 0 20px rgba(16, 185, 129, 0.4)" 
                              : "0 0 0px rgba(16, 185, 129, 0)" 
                          }}
                        >
                          {(user?.username || user?.name || "U")[0].toUpperCase()}
                        </motion.div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                          {user?.username || user?.name || "User"}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {user?.role || "User"}
                        </p>
                      </div>
                    </motion.button>
                    
                    {/* Enhanced Dropdown */}
                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                        >
                          {/* Header */}
                          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                                {(user?.username || user?.name || "U")[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {user?.username || user?.name || "User"}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {user?.email || "user@example.com"}
                                </p>
                                <div className="flex items-center mt-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    {user?.role || "User"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Menu Items */}
                          <div className="p-2">
                            {/* Settings */}
                            <motion.button
                              onClick={() => {
                                setDropdownOpen(false);
                                navigate(user?.role === "admin" ? "/admin/settings" : "/user/settings");
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                              whileHover={{ x: 4 }}
                            >
                              <FiSettings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              <span className="font-medium">Pengaturan</span>
                            </motion.button>
                            
                            {/* Logout */}
                            <motion.button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border-t border-gray-200/50 dark:border-gray-700/50 mt-2"
                              whileHover={{ x: 4 }}
                            >
                              <FiLogOut className="w-5 h-5" />
                              <span className="font-medium">Keluar</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <motion.button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all lg:hidden"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {theme === "dark" ? (
                    <FiSun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <FiMoon className="w-4 h-4 text-gray-600" />
                  )}
                </motion.button>
              )}

              {/* Mobile Menu Button */}
              <motion.button 
                className="lg:hidden p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiX className="w-5 h-5 text-emerald-600" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMenu className="w-5 h-5 text-emerald-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ✅ ENHANCED MOBILE MENU - MODERN & PROFESSIONAL */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop dengan Blur */}
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Modern Slide-in Menu Panel */}
            <motion.div
              className="lg:hidden fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 shadow-2xl overflow-hidden"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Header dengan Gradient */}
              <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-8">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Menu</h2>
                    <p className="text-emerald-100 text-sm">Navigasi Cepat</p>
                  </div>
                  <motion.button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all backdrop-blur-sm"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX className="w-6 h-6 text-white" />
                  </motion.button>
                </div>

                {/* User Info untuk Authenticated User */}
                {isAuthenticated && (
                  <motion.div 
                    className="relative z-10 mt-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white to-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold shadow-lg">
                          {(user?.username || user?.name || "U")[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg truncate">
                          {user?.username || user?.name || "User"}
                        </p>
                        <p className="text-emerald-100 text-xs truncate">
                          {user?.email || "user@example.com"}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="px-2 py-0.5 bg-emerald-400/30 text-emerald-100 text-xs font-semibold rounded-full">
                            {user?.role || "User"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Scrollable Menu Content */}
              <div className="overflow-y-auto h-[calc(100vh-200px)] px-6 py-6 space-y-3">
                {!isAuthenticated ? (
                  <>
                    {/* Navigation Items untuk Guest */}
                    <div className="space-y-2">
                      {navItems.map((item, index) => (
                        <motion.button
                          key={item.name}
                          onClick={() => handleNavigation(item.path)}
                          className={`flex items-center justify-between w-full p-4 rounded-xl transition-all group ${
                            location.pathname === item.path
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              location.pathname === item.path
                                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <item.icon className={`w-5 h-5 ${
                                location.pathname === item.path
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                            </div>
                            <span className={`font-semibold ${
                              location.pathname === item.path
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-gray-700 dark:text-gray-200'
                            }`}>
                              {item.name}
                            </span>
                          </div>
                          <FiChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                            location.pathname === item.path
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-400'
                          }`} />
                        </motion.button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-3">
                      <motion.button
                        onClick={() => handleNavigation("/verifikasi")}
                        className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiCheckCircle className="w-5 h-5" />
                        <span>Verifikasi QR Code</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleNavigation("/login")}
                        className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Masuk ke Akun
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Navigation untuk Authenticated User */}
                    <div className="space-y-2">
                      {navItems.map((item, index) => (
                        <motion.button
                          key={item.name}
                          onClick={() => handleNavigation(item.path)}
                          className={`flex items-center justify-between w-full p-4 rounded-xl transition-all group ${
                            location.pathname === item.path
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              location.pathname === item.path
                                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <item.icon className={`w-5 h-5 ${
                                location.pathname === item.path
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                            </div>
                            <span className={`font-semibold ${
                              location.pathname === item.path
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-gray-700 dark:text-gray-200'
                            }`}>
                              {item.name}
                            </span>
                          </div>
                          <FiChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                            location.pathname === item.path
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-400'
                          }`} />
                        </motion.button>
                      ))}

                      {/* Verifikasi Button */}
                      <motion.button
                        onClick={() => handleNavigation("/verifikasi")}
                        className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/50 dark:hover:to-teal-900/50 transition-all group"
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                            <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">Verifikasi</span>
                        </div>
                        <FiChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </div>

                    {/* Settings & Theme */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <motion.button
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all group"
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            {theme === "dark" ? (
                              <FiSun className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <FiMoon className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                          </span>
                        </div>
                        <FiChevronRight className="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          navigate(user?.role === "admin" ? "/admin/settings" : "/user/settings");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all group"
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">Pengaturan</span>
                        </div>
                        <FiChevronRight className="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </div>

                    {/* Logout Button */}
                    <div className="pt-4">
                      <motion.button
                        onClick={handleLogout}
                        className="flex items-center justify-center w-full p-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiLogOut className="w-5 h-5 mr-2" />
                        <span>Keluar dari Akun</span>
                      </motion.button>
                    </div>
                  </>
                )}
              </div>

              {/* Footer dengan Branding */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-100 via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent border-t border-gray-200 dark:border-gray-800">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                    <span>Powered by</span>
                    <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Sebumi</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}