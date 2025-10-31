import { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-toastify";

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "user", password: "" });

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/users");
        setUsers(response.data?.data || response.data || []);
      } catch (err) {
        console.error("Fetch users error:", err);
        if (err.response?.status === 405) {
          setError("Backend endpoint /users tidak mendukung method GET. Hubungi developer backend.");
        } else {
          setError("Failed to fetch user data. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 dark:text-red-400 text-center mt-8">{error}</p>;

  const openAddModal = () => {
    setEditUser(null);
    setForm({ name: "", email: "", role: "user", password: "" });
    setModalOpen(true);
  };
  const openEditModal = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
        toast.success("User berhasil diupdate!");
      } else {
        await api.post("/users", form);
        toast.success("User berhasil ditambahkan!");
      }
      setModalOpen(false);
      const response = await api.get("/users");
      setUsers(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Save user error:", err);
      if (err.response?.status === 405) {
        toast.error("Method tidak didukung oleh backend!");
      } else {
        toast.error("Gagal menyimpan user!");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus user ini?")) {
      try {
        await api.delete(`/users/${id}`);
        toast.success("User berhasil dihapus!");
        const response = await api.get("/users");
        setUsers(response.data?.data || response.data || []);
      } catch (err) {
        console.error("Delete user error:", err);
        toast.error("Gagal menghapus user!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 py-6 px-3 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-green-100 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-500 px-6 py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white">User Management</h1>
            <p className="text-green-100 mt-1 text-sm sm:text-base">Manage all registered users in the system</p>
          </div>

          {/* Controls */}
          <div className="p-4 sm:p-6 border-b border-green-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-green-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button 
                onClick={openAddModal}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 
                text-white font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              >
                Add New User
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead className="bg-green-50 dark:bg-gray-800">
                <tr>
                  {["Name", "Email", "Role", "Status", "Actions"].map((head) => (
                    <th key={head} className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-green-100 dark:divide-gray-700">
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-green-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-100 to-teal-100 flex items-center justify-center dark:from-gray-700 dark:to-gray-600">
                          <span className="text-green-600 dark:text-green-300 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' 
                            : 'bg-teal-100 text-teal-800 dark:bg-teal-700 dark:text-teal-100'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100">
                          Active
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 bg-white dark:bg-gray-900 border-t border-green-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{" "}
                <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-600'}`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md ${currentPage === page 
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' 
                      : 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-600'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${currentPage === totalPages 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-600'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Modal Add/Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editUser ? "Edit User" : "Add New User"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <select
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {!editUser && (
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
