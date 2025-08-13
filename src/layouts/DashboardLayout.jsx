import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FiMenu } from "react-icons/fi";

export default function DashboardLayout({ isUser = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 flex font-sans">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        <Sidebar isUser={isUser} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-8 p-4 md:p-8 relative">
        {/* Hamburger button for mobile */}
        <button
          className="md:hidden mb-4 w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow border border-green-100 text-green-700 hover:bg-green-50 transition self-start"
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu sidebar"
        >
          <FiMenu size={24} />
        </button>
        {/* Navbar khusus dashboard */}
        {/* <Navbar isUser /> */}
        {/* Konten halaman dashboard */}
        <Outlet />
      </div>
    </div>
  );
}