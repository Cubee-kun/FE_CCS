// pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PieChart, BarChart } from "../../components/Charts";
import Sidebar from "../../components/Sidebar";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  FiCalendar,
  FiCheckCircle,
  FiMonitor,
  FiUser,
  FiChevronDown,
  FiClock,
  FiMenu,
} from "react-icons/fi";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStats({});
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      title: "Total Perencanaan",
      value: stats?.total_perencanaan ?? 0,
      icon: <FiCalendar className="text-3xl" />,
      color: "bg-green-100 text-green-700",
      trend: "12% increase",
      trendColor: "text-green-600",
    },
    {
      title: "Implementasi",
      value: stats?.total_implementasi ?? 0,
      icon: <FiCheckCircle className="text-3xl" />,
      color: "bg-emerald-100 text-emerald-700",
      trend: "8% increase",
      trendColor: "text-emerald-600",
    },
    {
      title: "Monitoring",
      value: stats?.total_monitoring ?? 0,
      icon: <FiMonitor className="text-3xl" />,
      color: "bg-lime-100 text-lime-700",
      trend: "5% increase",
      trendColor: "text-lime-600",
    },
    {
      title: "User Aktif",
      value: "24",
      icon: <FiUser className="text-3xl" />,
      color: "bg-teal-100 text-teal-700",
      trend: "3 new users",
      trendColor: "text-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 p-4 md:p-8 flex font-sans">

      {/* Sidebar */}
      <Sidebar
        className={`
          bg-white shadow-xl
          w-64
          fixed top-0 left-0 h-full z-40
          md:relative md:h-auto md:top-auto md:left-auto
          ${sidebarOpen ? "block" : "hidden"}
          md:block
        `}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Toggle Sidebar Button (mobile only) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`
          fixed top-6 left-6 z-50 p-3 rounded-full
          bg-gradient-to-r from-green-500 to-green-700
          text-white shadow-lg
          hover:from-green-600 hover:to-green-800
          focus:outline-none focus:ring-4 focus:ring-green-300
          transition-all duration-300
          hover:scale-110 active:scale-95
          md:hidden
        `}
        aria-label="Toggle sidebar"
      >
        <FiMenu size={24} />
      </button>

      {/* Main Content */}
      <main
        className={`flex-grow transition-all duration-300
          ${sidebarOpen ? "ml-0" : "ml-0"} 
          md:ml-8
          bg-transparent
          `}
      >
        {/* Header */}
        <header className="bg-white rounded-xl p-6 mb-8 shadow-md sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-3xl font-extrabold text-green-900 mb-1">
                Selamat datang, {user?.name || "User"}!
              </h2>
              <p className="text-green-800 opacity-90 text-lg">
                Anda login sebagai{" "}
                <span className="font-semibold">{user?.role || "-"}</span>
              </p>
              <div className="flex items-center mt-3 text-sm text-green-700 opacity-80">
                <FiClock className="mr-2" />
                <span>
                  Terakhir login:{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {[  
                { label: "+ Perencanaan", path: "/perencanaan", color: "blue" },
                { label: "+ Implementasi", path: "/implementasi", color: "emerald" },
                { label: "+ Monitoring", path: "/monitoring", color: "lime" },
              ].map(({ label, path, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`
                    bg-white font-semibold px-5 py-2 rounded-lg shadow-md transition
                    ${
                      color === "blue"
                        ? "text-blue-600 hover:bg-blue-50 focus:ring-blue-400 focus:ring-2 focus:ring-offset-1"
                        : ""
                    }
                    ${
                      color === "emerald"
                        ? "text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-400 focus:ring-2 focus:ring-offset-1"
                        : ""
                    }
                    ${
                      color === "lime"
                        ? "text-lime-600 hover:bg-lime-50 focus:ring-lime-400 focus:ring-2 focus:ring-offset-1"
                        : ""
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="mb-8 border-b border-green-300">
          <ul className="flex space-x-8">
            {["overview", "reports", "activity"].map((tab) => (
              <li key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-lg font-semibold transition-colors border-b-4 ${
                    activeTab === tab
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-green-400 hover:text-green-600 hover:border-green-400"
                  } capitalize`}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {statCards.map(({ title, value, icon, color, trend, trendColor }, i) => (
            <article
              key={i}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-2">{title}</p>
                  <p className="text-3xl font-bold text-green-900">{value}</p>
                </div>
                <div
                  className={`rounded-lg p-3 ${color} flex items-center justify-center shadow-inner`}
                >
                  {icon}
                </div>
              </div>
              <p className={`text-xs ${trendColor}`}>{trend}</p>
            </article>
          ))}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h3 className="text-xl font-semibold text-green-900 mb-2 sm:mb-0">
                Jenis Kegiatan
              </h3>
              <div className="relative w-40">
                <select
                  className="w-full appearance-none bg-white border border-green-300 rounded-md pl-3 pr-8 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option>Last 7 days</option>
                  <option>Last month</option>
                  <option>Last year</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400" />
              </div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <PieChart data={stats?.kegiatan_stats || []} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h3 className="text-xl font-semibold text-green-900 mb-2 sm:mb-0">
                Progress Bulan Ini
              </h3>
              <div className="relative w-40">
                <select
                  className="w-full appearance-none bg-white border border-green-300 rounded-md pl-3 pr-8 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option>January 2023</option>
                  <option>February 2023</option>
                  <option>March 2023</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400" />
              </div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <BarChart data={stats?.monthly_stats || []} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
