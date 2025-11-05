import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PieChart, BarChart } from "../../components/charts/Charts";
import api from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiCheckCircle,
  FiActivity,
  FiUser,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiMoreVertical,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiFileText,
  FiMonitor,
} from "react-icons/fi";

const defaultStats = {
  total_perencanaan: 0,
  total_implementasi: 0,
  total_monitoring: 0,
  kegiatan_stats: [],
  monthly_stats: [],
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const pollingRef = useRef();

  // Polling function for realtime data
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        if (isMounted) {
          setStats({ ...defaultStats, ...data });
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching dashboard stats:", error);
          setError("Gagal memuat data dashboard.");
          setStats(defaultStats);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchStats();
    pollingRef.current = setInterval(fetchStats, 30000);

    return () => {
      isMounted = false;
      clearInterval(pollingRef.current);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refresh
  };

  const statCards = [
    {
      title: "Total Perencanaan",
      value: stats.total_perencanaan,
      icon: <FiFileText className="w-7 h-7" />,
      gradient: "from-emerald-400 via-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50/50 to-emerald-100/30 dark:from-emerald-900/10 dark:to-emerald-800/5",
      iconBg: "bg-emerald-500",
      trend: "+12%",
      trendUp: true,
      subtitle: "vs last month"
    },
    {
      title: "Implementasi",
      value: stats.total_implementasi,
      icon: <FiCheckCircle className="w-7 h-7" />,
      gradient: "from-teal-400 via-teal-500 to-teal-600",
      bgGradient: "from-teal-50/50 to-teal-100/30 dark:from-teal-900/10 dark:to-teal-800/5",
      iconBg: "bg-teal-500",
      trend: "+8%",
      trendUp: true,
      subtitle: "completion rate"
    },
    {
      title: "Monitoring",
      value: stats.total_monitoring,
      icon: <FiMonitor className="w-7 h-7" />,
      gradient: "from-green-400 via-green-500 to-green-600",
      bgGradient: "from-green-50/50 to-green-100/30 dark:from-green-900/10 dark:to-green-800/5",
      iconBg: "bg-green-500",
      trend: "+5%",
      trendUp: true,
      subtitle: "active monitoring"
    },
    {
      title: "User Aktif",
      value: stats.total_user || "3",
      icon: <FiUser className="w-7 h-7" />,
      gradient: "from-lime-400 via-lime-500 to-lime-600",
      bgGradient: "from-lime-50/50 to-lime-100/30 dark:from-lime-900/10 dark:to-lime-800/5",
      iconBg: "bg-lime-500",
      trend: "+3",
      trendUp: true,
      subtitle: "new users"
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner show={true} message="Memuat dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - Natural Theme */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-100/50 dark:border-gray-700/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Welcome Section */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 p-2"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.img
                    src="/images/icon.png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-700 via-teal-600 to-green-600 bg-clip-text text-transparent">
                    Selamat Datang, {user?.name?.split(' ')[0] || "Admin"}!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium">{user?.role || "Administrator"}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <FiClock className="w-3 h-3" />
                    <span className="text-xs">
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleRefresh}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-all flex items-center gap-2 shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={refreshing}
                >
                  <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 40px -10px rgba(16, 185, 129, 0.6)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiDownload className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <FiActivity className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards - Natural Palette */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              {/* Subtle Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Card Content */}
              <div className="relative glass bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-gray-700/50 shadow-lg group-hover:shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      {card.title}
                    </p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">
                      {card.value}
                    </h3>
                  </div>
                  <motion.div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-xl group-hover:shadow-emerald-500/30`}
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {card.icon}
                  </motion.div>
                </div>

                {/* Trend Indicator */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                    card.trendUp 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {card.trendUp ? (
                      <FiTrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <FiTrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span className="text-xs font-bold">{card.trend}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {card.subtitle}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section - Natural Theme */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            className="glass bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-xl overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Jenis Kegiatan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Distribusi aktivitas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 border-none focus:ring-2 focus:ring-emerald-500">
                    <option>Last 7 days</option>
                    <option>Last month</option>
                    <option>Last year</option>
                  </select>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <FiMoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80 flex items-center justify-center">
                <PieChart data={stats.kegiatan_stats} />
              </div>
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            className="glass bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-xl overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Progress Bulan Ini
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tren aktivitas bulanan
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 border-none focus:ring-2 focus:ring-emerald-500">
                    <option>This month</option>
                    <option>Last month</option>
                    <option>This year</option>
                  </select>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <FiMoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80 flex items-center justify-center">
                <BarChart data={stats.monthly_stats} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions - Natural Color Palette */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {[
            { 
              title: "Lihat Laporan", 
              icon: <FiEye className="w-6 h-6" />, 
              color: "from-emerald-500 to-teal-600", 
              path: "/admin/laporan",
              emoji: "📊"
            },
            { 
              title: "Buat Perencanaan", 
              icon: <FiCalendar className="w-6 h-6" />, 
              color: "from-teal-500 to-green-600", 
              path: "/admin/perencanaan",
              emoji: "📝"
            },
            { 
              title: "Monitor Aktivitas", 
              icon: <FiActivity className="w-6 h-6" />, 
              color: "from-green-500 to-lime-600", 
              path: "/admin/monitoring",
              emoji: "📈"
            },
          ].map((action, index) => (
            <motion.button
              key={index}
              onClick={() => navigate(action.path)}
              className="glass bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <div className="relative flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/30 transition-all duration-300`}>
                  {action.icon}
                </div>
                <div className="text-left flex-1">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {action.title}
                    <span className="text-xl">{action.emoji}</span>
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Akses cepat
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}