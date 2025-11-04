import { FiUser, FiSettings, FiLogOut, FiSun, FiMoon, FiCheckCircle, FiMenu, FiX, FiHome, FiInfo } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "./LoadingSpinner"; // ✅ Import LoadingSpinner

export default function Navbar({ isUser = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navigating, setNavigating] = useState(false); // ✅ State untuk loading
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

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navItems = [
    { name: "Beranda", path: "/", icon: FiHome },
    { name: "Tentang", path: "/about", icon: FiInfo },
  ];

  // ✅ Enhanced navigation dengan loading spinner
  const handleNavigation = (path) => {
    // Jangan navigate jika sudah di path yang sama
    if (location.pathname === path) {
      setMobileMenuOpen(false);
      setDropdownOpen(false);
      return;
    }

    // Tampilkan loading
    setNavigating(true);
    
    // Tutup mobile menu dan dropdown
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    
    // Navigate dengan delay untuk smooth transition
    setTimeout(() => {
      navigate(path);
      
      // Scroll to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      
      // Hide loading setelah navigate
      setTimeout(() => {
        setNavigating(false);
      }, 300);
    }, 150);
  };

  return (
    <>
      {/* ✅ Loading Spinner Overlay */}
      <LoadingSpinner 
        show={navigating} 
        message="Memuat halaman..." 
        size="normal" 
      />

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
            {/* Logo Section - ✅ Updated with larger image */}
            <motion.div 
              className="flex items-center space-x-3 group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation("/")}
            >
              <div className="relative flex items-center gap-3">
                {/* Logo Image with animated background */}
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full blur-xl opacity-30 group-hover:opacity-50"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.img
                    src="/images/icon.png"
                    alt="CCS-System Logo"
                    className="h-16 w-16 md:h-15 md:w-15 relative z-10 object-contain drop-shadow-2xl"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Text Content */}
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

            {/* Center Navigation - Enhanced with all buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Navigation Items */}
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)} // ✅ Enhanced navigation
                  className="relative px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
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
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              ))}

              {/* Verifikasi Button */}
              <motion.button
                onClick={() => handleNavigation("/verifikasi")} // ✅ Enhanced navigation
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>Verifikasi</span>
              </motion.button>

              {/* Auth Buttons for non-authenticated users */}
              {!isAuthenticated && (
                <motion.button
                  onClick={() => handleNavigation("/login")} // ✅ Enhanced navigation
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Masuk
                </motion.button>
              )}
            </div>

            {/* Right Section - Only for authenticated users */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  {/* Theme Toggle */}
                  <motion.button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {theme === "dark" ? (
                      <FiSun className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <FiMoon className="w-4 h-4 text-gray-600" />
                    )}
                  </motion.button>

                  {/* User Profile Button */}
                  <div className="relative" ref={dropdownRef}>
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
                /* Theme Toggle for non-authenticated users */
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
                className="lg:hidden p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
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
                      <FiX size={20} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMenu size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              className="lg:hidden fixed top-0 right-0 z-50 w-80 h-full bg-white dark:bg-gray-900 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Menu
                  </h2>
                  <motion.button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX size={20} />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {!isAuthenticated ? (
                  <>
                    {/* Navigation Items */}
                    {navItems.map((item, index) => (
                      <motion.button
                        key={item.name}
                        onClick={() => handleNavigation(item.path)} // ✅ Enhanced navigation
                        className="flex items-center space-x-3 w-full p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <item.icon className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium">{item.name}</span>
                      </motion.button>
                    ))}

                    {/* Auth Buttons */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <motion.button
                        onClick={() => handleNavigation("/verifikasi")} // ✅ Enhanced navigation
                        className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-medium transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                        whileHover={{ scale: 1.02 }}
                      >
                        🔍 Verifikasi
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleNavigation("/login")} // ✅ Enhanced navigation
                        className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                        whileHover={{ scale: 1.02 }}
                      >
                        Masuk
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                          {(user?.username || user?.name || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {user?.username || user?.name || "User"}
                          </p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            {user?.role || "User"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation for authenticated users */}
                    {navItems.map((item, index) => (
                      <motion.button
                        key={item.name}
                        onClick={() => handleNavigation(item.path)} // ✅ Enhanced navigation
                        className="flex items-center space-x-3 w-full p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <item.icon className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium">{item.name}</span>
                      </motion.button>
                    ))}

                    <motion.button
                      onClick={() => handleNavigation("/verifikasi")} // ✅ Enhanced navigation
                      className="flex items-center space-x-3 w-full p-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left"
                      whileHover={{ x: 5 }}
                    >
                      <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Verifikasi</span>
                    </motion.button>

                    <motion.button
                      onClick={toggleTheme}
                      className="flex items-center space-x-3 w-full p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
                      whileHover={{ x: 5 }}
                    >
                      {theme === "dark" ? (
                        <>
                          <FiSun className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium">Mode Terang</span>
                        </>
                      ) : (
                        <>
                          <FiMoon className="w-5 h-5 text-gray-600" />
                          <span className="font-medium">Mode Gelap</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={() => {
                        navigate(user?.role === "admin" ? "/admin/settings" : "/user/settings");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
                      whileHover={{ x: 5 }}
                    >
                      <FiSettings className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Pengaturan</span>
                    </motion.button>

                    <motion.button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                      whileHover={{ x: 5 }}
                    >
                      <FiLogOut className="w-5 h-5" />
                      <span className="font-medium">Keluar</span>
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}