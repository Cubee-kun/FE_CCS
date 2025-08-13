import { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";

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

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } catch (err) {
        setError("Failed to fetch user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;

  // Open modal untuk tambah/edit
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

  // Submit tambah/edit user
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
      } else {
        await api.post("/users", form);
      }
      setModalOpen(false);
      // Refresh data
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      alert("Gagal menyimpan user");
    }
  };

  // Hapus user
  const handleDelete = async (id) => {
    if (window.confirm("Hapus user ini?")) {
      await api.delete(`/users/${id}`);
      // Refresh data
      const response = await api.get("/users");
      setUsers(response.data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-green-600 to-teal-500 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-green-100 mt-1">Manage all registered users in the system</p>
          </div>

          {/* Search and controls */}
          <div className="p-6 border-b border-green-100 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                  xmlns="http://www.w3.org/2000/svg"
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
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                Add New User
              </button>
            </div>
          </div>

          {/* User table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-green-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-100">
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-green-100 to-teal-100 flex items-center justify-center">
                            <span className="text-green-600 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-teal-100 text-teal-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                        onClick={() => openEditModal(user)}
                        className="text-green-600 hover:text-green-800 mr-3">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-red-500 hover:text-red-700">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {modalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-green-100">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-600 to-teal-500 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">
                    {editUser ? "Edit User" : "Tambah User Baru"}
                  </h2>
                </div>
                
                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                    <input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Alamat email"
                      required
                    />
                  </div>

                  {/* Role Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Password Field (conditionally shown) */}
                  {!editUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Password"
                        required={!editUser}
                      />
                    </div>
                  )}

                  {/* Modal Footer */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-green-600 to-teal-500 text-white hover:from-green-700 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {editUser ? "Update" : "Simpan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white border-t border-green-100 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastUser, filteredUsers.length)}
                </span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md ${currentPage === page 
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${currentPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}