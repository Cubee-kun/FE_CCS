// components/AppLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Navbar from "../components/common/Navbar";

export default function AppLayout() {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Navbar />
      <Sidebar onClose={() => {}} />
      <main className="flex-1 md:ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
