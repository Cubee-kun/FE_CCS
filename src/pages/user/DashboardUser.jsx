// pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PieChart, BarChart } from "../../components/charts/Charts";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  FiCalendar,
  FiCheckCircle,
  FiMonitor,
  FiUser,
  FiChevronDown,
  FiClock,
} from "react-icons/fi";
import api from "../../api/axios";

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
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats({ ...defaultStats, ...data });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Jika endpoint tidak tersedia, gunakan data default
        if (error.response?.status === 404 || error.response?.status === 405) {
          console.warn(
            "Dashboard stats endpoint not available, using default data"
          );
          setStats(defaultStats);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ✅ Stat cards untuk user dashboard
  const statCards = [
    {
      title: "Total Perencanaan",
      value: stats.total_perencanaan || 0,
      icon: <FiCalendar className="text-3xl" />,
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
      trend: "5 new",
      trendColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Implementasi",
      value: stats.total_implementasi || 0,
      icon: <FiCheckCircle className="text-3xl" />,
      color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
      trend: "12% increase",
      trendColor: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Monitoring Aktif",
      value: stats.total_monitoring || 0,
      icon: <FiMonitor className="text-3xl" />,
      color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
      trend: "8% increase",
      trendColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Kegiatan Selesai",
      value: stats.completed_activities || 0,
      icon: <FiCheckCircle className="text-3xl" />,
      color: "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-200",
      trend: "3 new",
      trendColor: "text-lime-600 dark:text-lime-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex font-sans relative transition-colors">
      <main className="flex-grow p-3 md:p-6 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/40 z-50">
            <LoadingSpinner />
          </div>
        )}

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-md sticky top-0 z-10 transition">
          <h2 className="text-2xl md:text-3xl font-extrabold text-green-900 dark:text-green-200">
            Selamat datang, {user?.name || "User"}!
          </h2>
          <p className="text-green-800 dark:text-green-400">
            Anda login sebagai{" "}
            <span className="font-semibold">{user?.role || "-"}</span>
          </p>
          <div className="flex items-center mt-2 text-sm text-green-700 dark:text-green-400">
            <FiClock className="mr-2" />
            Terakhir login:{" "}
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </header>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map(({ title, value, icon, color, trend, trendColor }, i) => (
            <article
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{title}</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{value}</p>
                </div>
                <div className={`rounded-lg p-3 ${color} shadow-inner`}>{icon}</div>
              </div>
              <p className={`text-xs ${trendColor}`}>{trend}</p>
            </article>
          ))}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartPanel
            title="Jenis Kegiatan"
            data={stats.kegiatan_stats}
            ChartComponent={PieChart}
          />
          <ChartPanel
            title="Progress Bulan Ini"
            data={stats.monthly_stats}
            ChartComponent={BarChart}
          />
        </section>
      </main>
    </div>
  );
}

function ChartPanel({ title, data, ChartComponent }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-green-900 dark:text-green-200">
          {title}
        </h3>
        <div className="relative w-40 mt-3 sm:mt-0">
          <select
            className="w-full appearance-none bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 
            rounded-md pl-3 pr-8 py-2 text-sm text-green-800 dark:text-green-200
            focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
            aria-label={`${title} filter`}
          >
            <option>Last 7 days</option>
            <option>Last month</option>
            <option>Last year</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 dark:text-green-300" />
        </div>
      </div>
      <div className="h-80 flex items-center justify-center">
        <ChartComponent data={data} />
      </div>
    </div>
  );
}
