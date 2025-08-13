import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiFileText, FiActivity, FiX } from "react-icons/fi";

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: <FiHome /> },
    { label: "Users", path: "/admin/users", icon: <FiUsers /> },
    { label: "Laporan", path: "/admin/laporan", icon: <FiFileText /> },
    { label: "Activity", path: "/admin/activity", icon: <FiActivity /> },
  ];

  return (
    <>
      {/* Mobile overlay with nature-inspired gradient */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-green-500/10 to-teal-400/10 backdrop-blur-sm z-30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar container with nature theme */}
      <aside className="flex flex-col h-full bg-gradient-to-b from-green-50 to-teal-50 border-r border-green-200/50 shadow-lg p-6 w-64 z-40 relative">
        {/* Header with leaf-inspired design */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-green-200/50">
          <h2
            className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate("/admin/dashboard")}
          >
            Admin Sebumi
          </h2>
          {/* Close button with leaf color */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-full hover:bg-green-200/30 text-green-600 focus:outline-none transition-colors"
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Menu with natural transitions */}
        <nav className="flex flex-col space-y-1.5">
          {menuItems.map(({ label, path, icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => {
                  navigate(path);
                  onClose();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300
                  ${
                    isActive
                      ? "bg-gradient-to-r from-green-500/90 to-teal-500/90 text-white shadow-md shadow-green-200"
                      : "text-green-700 hover:bg-green-100/50 hover:text-green-800 hover:translate-x-1"
                  }
                `}
              >
                <span className={`text-lg ${isActive ? "text-white" : "text-green-600"}`}>
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

        {/* Footer with subtle nature theme */}
        <div className="mt-auto pt-4 text-xs text-center text-green-600/70">
          <p>AgroPariwisata v1.0</p>
          <p className="mt-1">Nature Conservation System</p>
        </div>
      </aside>
    </>
  );
}