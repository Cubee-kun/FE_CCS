import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiActivity,
  FiX,
  FiLayers,
  FiPlayCircle,
  FiEye,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Menu berdasarkan role
  const menuItems =
    user?.role === "admin"
      ? [
          { label: "Dashboard", path: "/admin/dashboard", icon: <FiHome /> },
          { label: "Users", path: "/admin/users", icon: <FiUsers /> },
          { label: "Laporan", path: "/admin/laporan", icon: <FiFileText /> },
          { label: "Activity", path: "/admin/activity", icon: <FiActivity /> },
          { label: "Perencanaan", path: "/admin/perencanaan", icon: <FiLayers /> },
          { label: "Implementasi", path: "/admin/implementasi", icon: <FiPlayCircle /> },
          { label: "Monitoring", path: "/admin/monitoring", icon: <FiEye /> },
        ]
      : [
          { label: "Dashboard", path: "/dashboardUser", icon: <FiHome /> },
          { label: "Perencanaan", path: "/perencanaan", icon: <FiLayers /> },
        ];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg p-6 w-64 z-40 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2
            className="text-xl font-bold text-green-700 cursor-pointer"
            onClick={() =>
              navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboardUser")
            }
          >
            AgroPariwisata {user?.role === "admin" ? "Admin" : "User"}
          </h2>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded hover:bg-green-100 text-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col space-y-2">
          {menuItems.map(({ label, path, icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => {
                  navigate(path);
                  onClose();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition
                  ${
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-green-700 hover:bg-green-100 hover:text-green-900"
                  }
                `}
              >
                <span className="text-lg">{icon}</span>
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 text-xs text-center text-green-600/70 dark:text-green-400/70">
          <p>AgroPariwisata v1.0</p>
          <p className="mt-1">Nature Conservation System</p>
        </div>
      </aside>
    </>
  );
}