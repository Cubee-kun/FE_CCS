import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiFileText, FiActivity, FiClipboard, FiX, FiCheckCircle, FiSettings, FiLogOut, FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useState, useRef, useEffect } from "react";

export default function Sidebar({ isUser = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const adminMenuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: <FiHome /> },
    { label: "Users", path: "/admin/users", icon: <FiUsers /> },
    { label: "Perencanaan", path: "/admin/perencanaan", icon: <FiClipboard /> },
    { label: "Implementasi", path: "/admin/implementasi", icon: <FiCheckCircle /> },
    { label: "Monitoring", path: "/admin/monitoring", icon: <FiActivity /> },
  ];

  // ✅ User menu items - Lengkap dengan semua menu
  const userMenuItems = [
    { label: "Dashboard", path: "/user/dashboard", icon: <FiHome /> },
    { label: "Implementasi", path: "/user/implementasi", icon: <FiCheckCircle /> },
    { label: "Monitoring", path: "/user/monitoring", icon: <FiActivity /> },
  ];

  const menuItems = isUser ? userMenuItems : adminMenuItems;

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
    onClose?.();
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <aside className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <motion.img
            src="/images/icon.png"
            alt="Logo"
            className="h-10 w-10 object-contain"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          />
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {isUser ? "User Panel" : "Admin Panel"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">3TREESIFY-System</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiX size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              whileHover={{ x: isActive ? 0 : 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400"}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse" />
              )}
            </motion.button>
          );
        })}

        {/* Verifikasi Button */}
        <motion.button
          onClick={() => handleNavigation(isUser ? "/user/verifikasi" : "/admin/verifikasi")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all border ${
            location.pathname.endsWith('/verifikasi')
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md border-emerald-500"
              : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800"
          }`}
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiCheckCircle className={location.pathname.endsWith('/verifikasi') ? "text-white" : ""} />
          <span className="font-medium">Verifikasi</span>
          {location.pathname.endsWith('/verifikasi') && (
            <span className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse" />
          )}
        </motion.button>

        {/* ✅ Laporan Button - Dipindah di bawah Verifikasi (hanya untuk admin) */}
        {!isUser && (
          <motion.button
            onClick={() => handleNavigation("/admin/laporan")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === "/admin/laporan"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiFileText className={location.pathname === "/admin/laporan" ? "text-white" : "text-emerald-600 dark:text-emerald-400"} />
            <span className="font-medium">Laporan</span>
            {location.pathname === "/admin/laporan" && (
              <span className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse" />
            )}
          </motion.button>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user?.username || user?.name || "User"}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
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
                className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
              >
                {/* Header */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                      {(user?.username || user?.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {user?.username || user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
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
                  {/* ✅ Theme Toggle - Moved to Dropdown */}
                  <motion.button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all text-sm"
                    whileHover={{ x: 4 }}
                  >
                    {theme === "dark" ? (
                      <>
                        <FiSun className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">Mode Terang</span>
                      </>
                    ) : (
                      <>
                        <FiMoon className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">Mode Gelap</span>
                      </>
                    )}
                  </motion.button>

                  {/* Settings */}
                  <motion.button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleNavigation(user?.role === "admin" ? "/admin/settings" : "/user/settings");
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all text-sm"
                    whileHover={{ x: 4 }}
                  >
                    <FiSettings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">Pengaturan</span>
                  </motion.button>
                  
                  {/* Logout */}
                  <motion.button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all border-t border-gray-200/50 dark:border-gray-700/50 mt-2 pt-2 text-sm"
                    whileHover={{ x: 4 }}
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span className="font-medium">Keluar</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          3TREESIFY v1.0
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {isUser ? "User Access" : "Admin Access"}
        </p>
      </div>
    </aside>
  );
}