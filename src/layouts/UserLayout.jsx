import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { FiClipboard, FiHome, FiX, FiMoon, FiSun } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  // Apply dark mode to <html> class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const menuItems = [
    { label: "Dashboard", path: "/user/dashboard", icon: <FiHome /> },
    { label: "Perencanaan", path: "/user/perencanaan", icon: <FiClipboard /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar Overlay (Mobile) */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-900 border-r border-green-200/50 dark:border-gray-700 shadow-lg z-40 p-6 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-green-200/50 dark:border-gray-700">
          <h2
            className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate("/user/dashboard")}
          >
            User Panel
          </h2>
          <div className="flex items-center gap-2">
            
            {/* Close (mobile only) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-full hover:bg-green-200/30 dark:hover:bg-gray-700 text-green-600 dark:text-emerald-400 focus:outline-none transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex flex-col space-y-1.5">
          {menuItems.map(({ label, path, icon }) => {
            const isActive = location.pathname.startsWith(path);
            return (
              <button
                key={label}
                onClick={() => {
                  navigate(path);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300
                  ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white shadow-md"
                      : "text-green-700 dark:text-gray-300 hover:bg-green-100/50 dark:hover:bg-gray-700/50 hover:text-green-800 dark:hover:text-white hover:translate-x-1"
                  }
                `}
              >
                <span
                  className={`text-lg ${
                    isActive ? "text-white" : "text-green-600 dark:text-emerald-400"
                  }`}
                >
                  {icon}
                </span>
                <span className="font-medium">{label}</span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 text-xs text-center text-green-600/70 dark:text-gray-400">
          <p>AgroPariwisata v1.0</p>
          <p className="mt-1">User Access Panel</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
