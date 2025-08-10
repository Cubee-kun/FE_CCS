import { useAuth } from "../contexts/AuthContext";
import { FiUser, FiHome, FiInfo, FiCheckCircle, FiMenu, FiX } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    };
    if (showAccountDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAccountDropdown]);

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      setShowAccountDropdown(!showAccountDropdown);
    }
  };

  const handleSetting = () => {
    setShowAccountDropdown(false);
    setMobileMenuOpen(false);
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user?.role === "user") {
      navigate("/user/dashboard");
    }
  };

  const handleLogout = () => {
    logout();
    setShowAccountDropdown(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleVerifikasiClick = () => {
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      navigate("/verifikasi");
    }
  };

  const menuItems = [
    { label: "Home", icon: <FiHome />, path: "/" },
    { label: "Tentang", icon: <FiInfo />, path: "/about" },
    { label: "Verifikasi", icon: <FiCheckCircle />, action: handleVerifikasiClick, isButton: true },
  ];

  return (
    <nav className="bg-gradient-to-r from-green-400 to-emerald-600 text-white sticky top-0 z-30 shadow-lg border-b border-green-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <h1
          className="text-2xl font-extrabold cursor-pointer select-none tracking-wide"
          onClick={() => {
            navigate("/");
            setMobileMenuOpen(false);
          }}
        >
          
        </h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8 font-medium text-lg tracking-wide">
          {menuItems.map(({ label, icon, path, action, isButton }) =>
            isButton ? (
              <button
                key={label}
                onClick={action}
                className="flex items-center space-x-2 bg-white text-green-700 font-semibold px-5 py-2 rounded-md shadow-md hover:shadow-lg hover:bg-green-100 transform hover:scale-[1.05] transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-green-300"
                aria-label={label}
              >
                {icon}
                <span>{label}</span>
              </button>
            ) : (
              <button
                key={label}
                onClick={() => {
                  navigate(path);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 hover:text-green-200 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-300 rounded"
                aria-label={label}
              >
                {icon}
                <span>{label}</span>
              </button>
            )
          )}

          {/* Account Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleAccountClick}
              className="flex items-center space-x-2 bg-green-700 bg-opacity-40 hover:bg-opacity-60 px-4 py-2 rounded-md shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-green-300"
              aria-haspopup="true"
              aria-expanded={showAccountDropdown}
              aria-label="User account menu"
            >
              <FiUser className="text-lg" />
              <span className="truncate max-w-xs">{isAuthenticated ? user?.username || "User" : "Login / Daftar"}</span>
            </button>

            {/* Dropdown */}
            {showAccountDropdown && isAuthenticated && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-green-300 text-green-900 z-40
                           animate-fadeIn origin-top-right"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                <button
                  onClick={handleSetting}
                  className="block w-full text-left px-4 py-2 hover:bg-green-100 transition-colors duration-200 focus:outline-none focus:bg-green-200"
                  role="menuitem"
                >
                  Setting
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 transition-colors duration-200 focus:outline-none focus:bg-red-200"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 hover:bg-green-600 transition"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-green-50 text-green-900 shadow-lg border-t border-green-200 animate-slideDown">
          <div className="flex flex-col space-y-2 px-4 py-4 font-medium text-base tracking-wide">
            {menuItems.map(({ label, icon, path, action, isButton }) =>
              isButton ? (
                <button
                  key={label}
                  onClick={action}
                  className="flex items-center space-x-3 bg-green-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-700 transition transform hover:scale-[1.05] focus:outline-none focus:ring-4 focus:ring-green-400"
                  aria-label={label}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ) : (
                <button
                  key={label}
                  onClick={() => {
                    navigate(path);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 hover:bg-green-100 px-4 py-2 rounded-md transition font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                  aria-label={label}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              )
            )}

            <hr className="my-3 border-green-300" />

            {/* Account info & dropdown in mobile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleAccountClick}
                className="w-full flex items-center space-x-3 bg-green-600 text-white px-4 py-2 rounded-md shadow-md transition hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-400"
                aria-haspopup="true"
                aria-expanded={showAccountDropdown}
                aria-label="User account menu"
              >
                <FiUser />
                <span className="truncate max-w-xs">{isAuthenticated ? user?.username || "User" : "Login / Daftar"}</span>
              </button>

              {showAccountDropdown && isAuthenticated && (
                <div
                  className="mt-2 bg-white rounded-md shadow-lg border border-green-300 text-green-900 z-40 animate-fadeIn"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-mobile"
                >
                  <button
                    onClick={handleSetting}
                    className="block w-full text-left px-4 py-2 hover:bg-green-100 transition-colors duration-200 focus:outline-none focus:bg-green-200"
                    role="menuitem"
                  >
                    Setting
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 transition-colors duration-200 focus:outline-none focus:bg-red-200"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animations for fadeIn and slideDown */}
      <style>
        {`
          @keyframes fadeIn {
            from {opacity: 0; transform: translateY(-5px);}
            to {opacity: 1; transform: translateY(0);}
          }
          .animate-fadeIn {
            animation: fadeIn 0.25s ease forwards;
          }
          @keyframes slideDown {
            from {opacity: 0; max-height: 0;}
            to {opacity: 1; max-height: 1000px;}
          }
          .animate-slideDown {
            animation: slideDown 0.3s ease forwards;
          }
        `}
      </style>
    </nav>
  );
}
