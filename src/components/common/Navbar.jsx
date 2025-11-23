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

  return (
    <motion.nav
      className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm transition-all duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Logo Section - LARGER */}
          <motion.div 
            className="flex items-center space-x-3 group cursor-pointer flex-shrink-0"
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
                {/* ✅ Logo size: dari h-12/w-12 menjadi h-16/w-16 */}
                <motion.img
                  src="/images/icon.png"
                  alt="CCS-System Logo"
                  className="h-14 w-14 md:h-16 md:w-16 relative z-10 object-contain drop-shadow-2xl"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex flex-col">
                {/* ✅ Text size: text-lg/md:text-xl menjadi text-xl/md:text-2xl */}
                <motion.h1 
                  className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight"
                  whileHover={{ scale: 1.05 }}
                >
                  3TREESIFY
                </motion.h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight">
                  Traceability, Transparancy & Trust

                </p>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation - LARGER BUTTONS */}
          <div className="hidden lg:flex items-center space-x-3">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`relative px-5 py-3 rounded-xl text-base font-semibold transition-all group ${
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
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {location.pathname === item.path && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    layoutId="activeNav"
                  />
                )}
              </motion.button>
            ))}

            {/* ✅ Verifikasi Button - LARGER */}
            <motion.button
              onClick={() => handleNavigation("/verifikasi")}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl text-base font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border-2 border-emerald-200 dark:border-emerald-800"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiCheckCircle className="w-5 h-5" />
              <span>Verifikasi</span>
            </motion.button>

            {/* Dashboard Button - LARGER */}
            {isAuthenticated && (
              <motion.button
                onClick={() => handleNavigation(user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard')}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <FiGrid className="w-5 h-5" />
                <span>Dashboard</span>
              </motion.button>
            )}
          </div>

          {/* Right Section - LARGER BUTTONS */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Theme Toggle - Hidden on mobile, shown on desktop */}
                <motion.button
                  onClick={toggleTheme}
                  className="hidden lg:block p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {theme === "dark" ? (
                    <FiSun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <FiMoon className="w-5 h-5 text-gray-600" />
                  )}
                </motion.button>

                {/* ✅ Profile Button - Desktop - LARGER */}
                <div className="hidden lg:block relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-3 px-4 py-2.5 rounded-xl border-2 border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <motion.div 
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg text-base"
                        whileHover={{ scale: 1.1 }}
                        animate={{ 
                          boxShadow: dropdownOpen 
                            ? "0 0 20px rgba(16, 185, 129, 0.4)" 
                            : "0 0 0px rgba(16, 185, 129, 0)" 
                        }}
                      >
                        {(user?.username || user?.name || "U")[0].toUpperCase()}
                      </motion.div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                        {user?.username || user?.name || "User"}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        {user?.role || "User"}
                      </p>
                    </div>
                  </motion.button>
                  
                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
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
              <>
                {/* Login Button - LARGER */}
                <motion.button
                  onClick={() => handleNavigation("/login")}
                  className="hidden lg:flex items-center space-x-2 px-6 py-3 rounded-xl text-base font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 border-2 border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <FiUser className="w-5 h-5" />
                  <span>Masuk</span>
                </motion.button>

                {/* Theme Toggle - Mobile only */}
                <motion.button
                  onClick={toggleTheme}
                  className="lg:hidden p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {theme === "dark" ? (
                    <FiSun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <FiMoon className="w-5 h-5 text-gray-600" />
                  )}
                </motion.button>
              </>
            )}

            {/* ✅ Mobile Menu Button - LARGER */}
            <motion.button 
              className="lg:hidden p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border-2 border-emerald-200 dark:border-emerald-800"
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
                    <FiX className="w-6 h-6 text-emerald-600" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiMenu className="w-6 h-6 text-emerald-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}