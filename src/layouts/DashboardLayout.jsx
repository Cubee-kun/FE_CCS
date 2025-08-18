import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiMenu, FiSun, FiMoon } from "react-icons/fi";

export default function DashboardLayout({ isUser = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Sync dark mode ke HTML <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex font-sans bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        <Sidebar isUser={isUser} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-8 p-4 md:p-8 relative">
        <div className="flex items-center justify-between mb-4">
          {/* Hamburger button for mobile */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow border border-green-100 dark:border-gray-700 text-green-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700 transition"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu sidebar"
          >
            <FiMenu size={24} />
          </button>
        </div>

        {/* Konten Halaman */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 md:p-6 flex-1 transition-colors duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
