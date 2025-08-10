import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PieChart, BarChart } from '../components/Charts';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FiLogOut, 
  FiCalendar, 
  FiCheckCircle, 
  FiMonitor, 
  FiUser,
  FiChevronDown,
  FiClock
} from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: 'Total Perencanaan',
      value: stats?.total_perencanaan || 0,
      icon: <FiCalendar className="text-2xl" />,
      color: 'bg-emerald-100 text-emerald-700',
      trend: '12% increase',
      trendColor: 'text-emerald-600'
    },
    {
      title: 'Implementasi',
      value: stats?.total_implementasi || 0,
      icon: <FiCheckCircle className="text-2xl" />,
      color: 'bg-blue-100 text-blue-700',
      trend: '8% increase',
      trendColor: 'text-blue-600'
    },
    {
      title: 'Monitoring',
      value: stats?.total_monitoring || 0,
      icon: <FiMonitor className="text-2xl" />,
      color: 'bg-amber-100 text-amber-700',
      trend: '5% increase',
      trendColor: 'text-amber-600'
    },
    {
      title: 'User Aktif',
      value: '24',
      icon: <FiUser className="text-2xl" />,
      color: 'bg-violet-100 text-violet-700',
      trend: '3 new users',
      trendColor: 'text-violet-600'
    }
  ];

  const activities = [
    {
      id: 1,
      title: 'Perencanaan baru disubmit',
      time: '2 jam yang lalu',
      icon: <FiCalendar className="text-blue-500" />
    },
    {
      id: 2,
      title: 'Implementasi selesai',
      time: '5 jam yang lalu',
      icon: <FiCheckCircle className="text-emerald-500" />
    },
    {
      id: 3,
      title: 'Monitoring terbaru',
      time: '1 hari yang lalu',
      icon: <FiMonitor className="text-amber-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-emerald-50">
      {/* Header */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Banner */}

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'reports', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${card.color}`}>
                  {card.icon}
                </div>
              </div>
              <p className={`text-xs mt-2 ${card.trendColor}`}>{card.trend}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Jenis Kegiatan</h2>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Last 7 days</option>
                  <option>Last month</option>
                  <option>Last year</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <PieChart data={stats?.kegiatan_stats || []} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Progress Bulan Ini</h2>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>January 2023</option>
                  <option>February 2023</option>
                  <option>March 2023</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <BarChart data={stats?.monthly_stats || []} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    {activity.icon}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 text-center">
            <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Lihat semua aktivitas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;