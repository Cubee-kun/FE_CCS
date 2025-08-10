// pages/admin/RecentActivity.jsx
import { FiCalendar, FiCheckCircle, FiMonitor } from "react-icons/fi";

const activities = [
  {
    id: 1,
    title: "Perencanaan baru disubmit",
    time: "2 jam yang lalu",
    icon: <FiCalendar className="text-blue-500" />,
  },
  {
    id: 2,
    title: "Implementasi selesai",
    time: "5 jam yang lalu",
    icon: <FiCheckCircle className="text-emerald-500" />,
  },
  {
    id: 3,
    title: "Monitoring terbaru",
    time: "1 hari yang lalu",
    icon: <FiMonitor className="text-amber-500" />,
  },
];

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden max-w-4xl mx-auto">
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
  );
}
