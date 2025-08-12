import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FiMenu } from "react-icons/fi";

export default function DashboardLayout({ isUser = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 flex font-sans">
      {/* Mobile Sidebar Toggle */}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        <Sidebar isUser={isUser} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-8 p-4 md:p-8 relative">
        {/* Navbar is now integrated into the main content header */}
        
        {/* The Outlet will render the dashboard content */}
        <Outlet />
      </div>
    </div>
  );
}