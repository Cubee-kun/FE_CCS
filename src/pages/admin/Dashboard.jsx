// pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PieChart, BarChart } from "../../components/Charts";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats({ ...defaultStats, ...data });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Perencanaan",
      value: stats.total_perencanaan,
      icon: <FiCalendar className="text-3xl" />,
      color: "bg-green-100 text-green-700",
      trend: "12% increase",
      trendColor: "text-green-600",
    },
    {
      title: "Implementasi",
      value: stats.total_implementasi,
      icon: <FiCheckCircle className="text-3xl" />,
      color: "bg-emerald-100 text-emerald-700",
      trend: "8% increase",
      trendColor: "text-emerald-600",
    },
    {
      title: "Monitoring",
      value: stats.total_monitoring,
      icon: <FiMonitor className="text-3xl" />,
      color: "bg-lime-100 text-lime-700",
      trend: "5% increase",
      trendColor: "text-lime-600",
    },
    {
      title: "User Aktif",
      value: "3", // Kalau mau dinamis, update dari backend juga
      icon: <FiUser className="text-3xl" />,
      color: "bg-teal-100 text-teal-700",
      trend: "3 new users",
      trendColor: "text-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 flex font-sans relative">

      {/* Main Content */}
      <main className="flex-grow md:ml-0 p-2 md:p-3 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 z-50">
            <LoadingSpinner />
          </div>
        )}

        {/* Header */}
        <header className="bg-white rounded-xl p-6 mb-8 shadow-md sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-green-900">
                Selamat datang, {user?.name || "User"}!
              </h2>
              <p className="text-green-800">
                Anda login sebagai{" "}
                <span className="font-semibold">{user?.role || "-"}</span>
              </p>
              <div className="flex items-center mt-2 text-sm text-green-700">
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
            </div>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "+ Perencanaan", path: "/perencanaan", color: "blue" },
                { label: "+ Implementasi", path: "/implementasi", color: "emerald" },
                { label: "+ Monitoring", path: "/monitoring", color: "lime" },
              ].map(({ label, path, color }) => (
                <button
                  key={label}
                  onClick={() => {
                    navigate(path);
                    setSidebarOpen(false);
                  }}
                  className={`bg-white font-semibold px-5 py-2 rounded-lg shadow-md transition ${
                    color === "blue"
                      ? "text-blue-600 hover:bg-blue-50"
                      : color === "emerald"
                      ? "text-emerald-600 hover:bg-emerald-50"
                      : "text-lime-600 hover:bg-lime-50"
                  }`}
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
            {["overview", "users","reports", "activity"].map((tab) => (
              <li key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-lg font-semibold border-b-4 transition-colors capitalize ${
                    activeTab === tab
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-green-400 hover:text-green-600 hover:border-green-400"
                  }`}
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
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm font-medium text-green-600">{title}</p>
                  <p className="text-3xl font-bold text-green-900">{value}</p>
                </div>
                <div className={`rounded-lg p-3 ${color} shadow-inner`}>{icon}</div>
              </div>
              <p className={`text-xs ${trendColor}`}>{trend}</p>
            </article>
          ))}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartPanel title="Jenis Kegiatan" data={stats.kegiatan_stats} ChartComponent={PieChart} />
          <ChartPanel title="Progress Bulan Ini" data={stats.monthly_stats} ChartComponent={BarChart} />
        </section>
      </main>
    </div>
  );
}

function ChartPanel({ title, data, ChartComponent }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-semibold text-green-900">{title}</h3>
        <div className="relative w-40">
          <select
            className="w-full appearance-none bg-white border border-green-300 rounded-md pl-3 pr-8 py-2 text-sm
             focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label={`${title} filter`}
          >
            <option>Last 7 days</option>
            <option>Last month</option>
            <option>Last year</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400" />
        </div>
      </div>
      <div className="h-80 flex items-center justify-center">
        <ChartComponent data={data} />
      </div>
    </div>
  );
}
