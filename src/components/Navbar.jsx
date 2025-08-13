import { FiUser, FiSettings, FiLogOut, FiSun, FiMoon, FiCheckCircle } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";


export default function Navbar({ isUser = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Dark mode toggle effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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
    <header className="flex items-center justify-between bg-white/90 dark:bg-gray-300/90 backdrop-blur-sm shadow-sm px-4 md:px-6 py-3 sticky top-0 z-50 border-b border-green-200/50 dark:border-green-800/50">
      {/* Logo */}
      <div>
        <motion.img
                  src="/images/sebumi.png"
                  alt="Sebumi Logo"
                  className="h-10 w-auto cursor-pointer"
                  onClick={() => navigate("/")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
      </div>

      {/* Right side - User controls */}
      <div className="flex items-center space-x-2 md:space-x-4 relative" ref={dropdownRef}>
        {!isAuthenticated ? (
          <>
            <button
              onClick={() => navigate("/verifikasi")}
              className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              Verifikasi
            </button>
            <button
              onClick={() => navigate("/login")}
              className="border border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="hidden md:inline bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              Sign Up Free
            </button>
          </>
        ) : (
          <>
            {/* Tombol Verifikasi selalu tampil di samping user */}
            <button
              onClick={() => navigate("/verifikasi")}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              <FiCheckCircle />
              <span>Verifikasi</span>
            </button>
            <button
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label="User menu"
            >
              <FiUser className="text-white" />
              <span>{user?.username || user?.name || "User"}</span>
            </button>
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-60 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-green-200/50 dark:border-green-800/50 overflow-hidden z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-green-200/50 dark:border-green-800/50">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                    {user?.email || user?.username}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {user?.role || "User"}
                  </p>
                </div>
                <button
                  onClick={() => setDarkMode((prev) => !prev)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-700/50 transition-colors"
                >
                  {darkMode ? (
                    <>
                      <FiSun className="text-yellow-500" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <FiMoon className="text-green-600 dark:text-green-400" />
                      Dark Mode
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/settings");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-700/50 transition-colors"
                >
                  <FiSettings className="text-green-600 dark:text-green-400" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 transition-colors border-t border-green-200/50 dark:border-green-800/50"
                >
                  <FiLogOut className="text-red-500 dark:text-red-400" />
                  Logout
                </button>
              </div>
            )}
          </>
        )}
      </div>
        </header>
      );
    }