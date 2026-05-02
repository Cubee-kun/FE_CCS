import { FiUser, FiSettings, FiLogOut, FiSun, FiMoon, FiCheckCircle, FiMenu, FiX, FiHome, FiInfo, FiChevronRight, FiGrid } from "react-icons/fi";
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

  // ✅ Smart navigation ke verifikasi
  const handleVerifikasiNav = () => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/verifikasi");
      } else if (user?.role === "user") {
        navigate("/user/verifikasi");
      }
    } else {
      navigate("/verifikasi");
    }
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 w-screen -ml-[calc((100vw-100%)/2)] bg-transparent transition-all duration-300"
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-16 flex items-center justify-between rounded-full px-6 lg:px-8 backdrop-blur-2xl border border-green-600/60 dark:border-green-700/50 bg-gradient-to-r from-green-700/90 to-green-800/90 dark:from-green-800/85 dark:to-green-900/85 shadow-[0_12px_30px_-12px_rgba(21,128,61,0.75)]">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center space-x-2.5 group cursor-pointer flex-shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation("/")}
          >
            <div className="relative flex items-center gap-2.5">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-green-300 to-cyan-300 rounded-full blur-lg opacity-40 group-hover:opacity-60"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.img
                  src="/images/icon.png"
                  alt="CCS-System Logo"
                  className="h-10 w-10 relative z-10 object-contain drop-shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex flex-col">
                <motion.h1 
                  className="text-lg font-bold text-white leading-tight"
                  whileHover={{ scale: 1.05 }}
                >
                  3TREESIFY
                </motion.h1>
                <p className="text-xs text-emerald-100 font-medium leading-tight hidden sm:block">
                  Traceability System
                </p>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all group ${
                  location.pathname === item.path
                    ? "text-white bg-white/20 shadow-lg shadow-emerald-400/50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <span>{item.name}</span>
                {location.pathname === item.path && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-300 rounded-full shadow-md shadow-emerald-300/50"
                    layoutId="activeNav"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}

            {/* Verifikasi Button */}
            <motion.button
              onClick={handleVerifikasiNav}
              className="mx-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/20 hover:border-white/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Verifikasi</span>
            </motion.button>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {isAuthenticated ? (
              <>
                {/* Theme Toggle - Hidden on mobile */}
                <motion.button
                  onClick={toggleTheme}
                  className="hidden sm:block p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {theme === "dark" ? (
                    <FiSun className="w-5 h-5 text-yellow-300" />
                  ) : (
                    <FiMoon className="w-5 h-5 text-slate-100" />
                  )}
                </motion.button>

                {/* Profile Button - Desktop */}
                <div className="hidden lg:block relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <motion.div 
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-green-400 flex items-center justify-center text-green-900 font-bold shadow-lg text-sm"
                        whileHover={{ scale: 1.1 }}
                        animate={{ 
                          boxShadow: dropdownOpen 
                            ? "0 0 20px rgba(16, 185, 129, 0.6)" 
                            : "0 0 0px rgba(16, 185, 129, 0)" 
                        }}
                      >
                        {(user?.username || user?.name || "U")[0].toUpperCase()}
                      </motion.div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-200 rounded-full border-2 border-green-800"></div>
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                        {user?.username || user?.name || "User"}
                      </p>
                      <p className="text-xs text-emerald-100 font-medium">
                        {user?.role || "User"}
                      </p>
                    </div>
                  </motion.button>
                  
                  {/* Desktop Dropdown Menu */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-3 w-80 bg-green-50/90 dark:bg-green-950/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-green-200/70 dark:border-green-800/60 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-green-900/20 border-b border-green-200/50 dark:border-green-800/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-green-900 text-lg font-bold">
                              {(user?.username || user?.name || "U")[0].toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {user?.username || user?.name || "User"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {user?.email || "user@example.com"}
                              </p>
                              <div className="flex items-center mt-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                                  {user?.role || "User"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="p-2">
                          <motion.button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate(user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-800/60 rounded-xl transition-all"
                            whileHover={{ x: 4 }}
                          >
                            <FiGrid className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">Dashboard</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate(user?.role === "admin" ? "/admin/settings" : "/user/settings");
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-800/60 rounded-xl transition-all"
                            whileHover={{ x: 4 }}
                          >
                            <FiSettings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">Pengaturan</span>
                          </motion.button>
                          
                          <motion.button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border-t border-green-200/50 dark:border-green-800/50 mt-2"
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
              <>
                {/* Login Button - Desktop Only */}
                <motion.button
                  onClick={() => handleNavigation("/login")}
                  className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold text-green-900 bg-white hover:bg-emerald-50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <FiUser className="w-4 h-4" />
                  <span>Masuk</span>
                </motion.button>

                {/* Theme Toggle - Mobile */}
                <motion.button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {theme === "dark" ? (
                    <FiSun className="w-5 h-5 text-yellow-300" />
                  ) : (
                    <FiMoon className="w-5 h-5 text-slate-100" />
                  )}
                </motion.button>
              </>
            )}

            {/* Mobile Menu Button */}
            <motion.button 
              className="lg:hidden p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
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
                    <FiX className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiMenu className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ✅ Mobile Menu - Improved */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{ top: '72px', zIndex: 30 }}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              className="fixed top-[72px] left-0 right-0 bg-white dark:bg-gray-900 shadow-xl max-h-[calc(100vh-72px)] overflow-y-auto lg:hidden z-40"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 sm:p-6 space-y-3">
                {/* Navigation Links */}
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl font-semibold transition-all ${
                      location.pathname === item.path
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-600"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-transparent hover:border-green-300 dark:hover:border-green-800"
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {location.pathname === item.path && (
                      <FiCheckCircle className="w-5 h-5 ml-auto text-green-600" />
                    )}
                  </motion.button>
                ))}

                {/* Divider */}
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

                {/* Verifikasi Button */}
                <motion.button
                  onClick={handleVerifikasiNav}
                  className="w-full flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-600 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Verifikasi QR Code</span>
                </motion.button>

                {isAuthenticated ? (
                  <>
                    {/* Dashboard Button */}
                    <motion.button
                      onClick={() => handleNavigation(user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard')}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 transition-all shadow-md"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiGrid className="w-5 h-5" />
                      <span>Dashboard</span>
                    </motion.button>

                    {/* Settings & Logout */}
                    <motion.button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(user?.role === "admin" ? "/admin/settings" : "/user/settings");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl font-semibold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiSettings className="w-5 h-5" />
                      <span>Pengaturan</span>
                    </motion.button>

                    <motion.button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border-2 border-red-200 dark:border-red-800"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiLogOut className="w-5 h-5" />
                      <span>Keluar</span>
                    </motion.button>
                  </>
                ) : (
                  /* Login Button - Mobile */
                  <motion.button
                    onClick={() => handleNavigation("/login")}
                    className="w-full flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiUser className="w-5 h-5" />
                    <span>Masuk / Daftar</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}