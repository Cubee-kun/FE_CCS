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
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";

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
          { label: "Dashboard", path: "/user/dashboard", icon: <FiHome /> },
          { label: "Perencanaan", path: "/user/perencanaan", icon: <FiLayers /> },
        ];

  return (
    <>
      {onClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className="flex flex-col h-full glass-effect border-r border-white/10 shadow-2xl p-6 w-64 z-40 relative">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex-1 cursor-pointer"
              onClick={() =>
                navigate(user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard")
              }
            >
              <h2 className="text-xl font-bold premium-text mb-1">
                AgroPariwisata
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                {user?.role === "admin" ? "Admin Panel" : "User Panel"}
              </p>
            </motion.div>
            
            {onClose && (
              <motion.button
                onClick={onClose}
                className="md:hidden p-2 rounded-xl glass-effect glass-hover"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX size={20} className="text-gray-600 dark:text-gray-400" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex flex-col space-y-1.5 flex-1 overflow-y-auto scrollbar-premium">
          {menuItems.map(({ label, path, icon }, index) => {
            const isActive = location.pathname === path;
            return (
              <motion.button
                key={label}
                onClick={() => {
                  navigate(path);
                  if (onClose) onClose();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? "premium-gradient text-white shadow-premium"
                    : "glass-effect text-gray-700 dark:text-gray-200 glass-hover"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 premium-gradient"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <span className={`text-lg relative z-10 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {icon}
                </span>
                
                <span className="font-medium relative z-10 flex-1">{label}</span>
                
                {isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-2 w-2 rounded-full bg-white/90 relative z-10"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="glass-effect rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">AgroPariwisata v1.0</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Nature Conservation System</p>
          </div>
        </div>
      </aside>
    </>
  );
}