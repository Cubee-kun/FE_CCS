import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import { FiMenu } from "react-icons/fi";

export default function DashboardLayout({ isUser = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Sidebar Desktop - Fixed */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:left-0 md:w-64 md:z-30">
        <Sidebar isUser={isUser} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar Mobile - Overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 left-0 w-64 z-50 md:hidden">
            <Sidebar isUser={isUser} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content Area - With left margin for desktop sidebar */}
      <div className="flex-1 md:ml-64 w-full">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
            aria-label="Buka menu sidebar"
          >
            <FiMenu size={24} />
          </button>
          <h1 className="ml-4 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            3TREESIFY Admin
          </h1>
        </div>

        {/* Content Container */}
        <div className="p-4 md:p-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 transition-colors duration-300">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
