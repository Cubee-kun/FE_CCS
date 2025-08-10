// components/Sidebar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiFileText, FiActivity, FiX } from "react-icons/fi";

export default function Sidebar({ className = "", onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: <FiHome /> },
    { label: "User", path: "/admin/user", icon: <FiUsers /> },
    { label: "Laporan", path: "/admin/laporan", icon: <FiFileText /> },
    { label: "Recent Activity", path: "/admin/recent-activity", icon: <FiActivity /> },
  ];

  return (
    <>
      {/* Overlay untuk mobile, klik menutup sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden ${
          className.includes("hidden") ? "hidden" : "block"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50
          md:static md:h-auto md:shadow-none
          flex flex-col
          ${className}
        `}
      >
        {/* Header dengan tombol close di mobile */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 font-bold text-xl">
          <div
            className="cursor-pointer"
            onClick={() => navigate("/admin/dashboard")}
          >
            MyApp Admin
          </div>
          {/* Tombol close hanya tampil di mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Close sidebar"
            >
              <FiX size={24} />
            </button>
          )}
        </div>

        <nav className="mt-6 flex flex-col flex-grow">
          {menuItems.map(({ label, path, icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition ${
                  isActive ? "bg-blue-100 text-blue-700 font-semibold" : ""
                }`}
              >
                <span className="mr-3 text-lg">{icon}</span> {label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
