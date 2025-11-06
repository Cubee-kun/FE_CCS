import { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiMail, FiShield, 
  FiUser, FiX, FiCheck, FiAlertCircle, FiChevronLeft, FiChevronRight,
  FiFilter, FiDownload, FiRefreshCw
} from "react-icons/fi";

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "user", password: "" });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      const userData = response.data?.data || response.data || [];
      console.log('[UserPage] Users fetched:', userData);
      setUsers(userData);
      setError(null);
    } catch (err) {
      console.error("Fetch users error:", err);
      if (err.response?.status === 403) {
        setError("Anda tidak memiliki izin untuk melihat data users.");
      } else if (err.response?.status === 405) {
        setError("Backend endpoint /users tidak mendukung method GET.");
      } else {
        setError("Gagal memuat data user. Silakan coba lagi.");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter dan search
  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "all" || user.role === filterRole;
    return matchSearch && matchRole;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Modal handlers
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

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ✅ Clean form data - don't send empty password
      const submittedData = { ...form };
      
      if (editUser) {
        // ✅ For edit: don't send empty password
        if (!submittedData.password || submittedData.password.trim() === '') {
          delete submittedData.password;
        }
        console.log('[UserPage] Updating user:', editUser.id, submittedData);
        await api.put(`/users/${editUser.id}`, submittedData);
        toast.success("✅ User berhasil diupdate!");
      } else {
        // ✅ For create: password is required
        if (!submittedData.password || submittedData.password.trim() === '') {
          toast.error("❌ Password harus diisi!");
          setSubmitting(false);
          return;
        }
        console.log('[UserPage] Creating new user:', submittedData);
        await api.post("/users", submittedData);
        toast.success("✅ User berhasil ditambahkan!");
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Save user error:", err.response || err);
      
      if (err.response?.status === 403) {
        toast.error("❌ Anda tidak memiliki izin untuk melakukan aksi ini!");
      } else if (err.response?.status === 422) {
        const messages = err.response?.data?.messages;
        if (messages) {
          Object.values(messages).forEach(msg => {
            toast.error(`❌ ${Array.isArray(msg) ? msg[0] : msg}`);
          });
        } else {
          toast.error("❌ Validasi gagal!");
        }
      } else if (err.response?.status === 500) {
        const errorMsg = err.response?.data?.message || 'Terjadi kesalahan server';
        console.error('[UserPage] Server error:', errorMsg);
        toast.error(`❌ Error: ${errorMsg}`);
      } else {
        toast.error(`❌ ${err.response?.data?.message || err.response?.data?.error || 'Gagal menyimpan user!'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      console.log('[UserPage] Deleting user:', userToDelete.id);
      await api.delete(`/users/${userToDelete.id}`);
      toast.success("✅ User berhasil dihapus!");
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err.response || err);
      
      if (err.response?.status === 403) {
        toast.error("❌ Anda tidak memiliki izin untuk menghapus user ini!");
      } else if (err.response?.status === 500) {
        const errorMsg = err.response?.data?.message || 'Terjadi kesalahan server';
        console.error('[UserPage] Server error:', errorMsg);
        toast.error(`❌ Error: ${errorMsg}`);
      } else {
        toast.error(`❌ ${err.response?.data?.message || err.response?.data?.error || 'Gagal menghapus user!'}`);
      }
    }
  };

  if (loading) return <LoadingSpinner show={true} message="Memuat data users..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                Kelola semua pengguna sistem
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-4">
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-md border border-emerald-100 dark:border-emerald-900"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-emerald-600">{users.length}</p>
              </motion.div>
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-md border border-teal-100 dark:border-teal-900"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-teal-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FiAlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Controls Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filter */}
            <div className="md:col-span-3 relative">
              <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all"
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Actions */}
            <div className="md:col-span-4 flex gap-2">
              <motion.button
                onClick={fetchUsers}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiRefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>
              
              <motion.button
                onClick={openAddModal}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-medium shadow-lg transition-all"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(16, 185, 129, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <FiUserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah User</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          <AnimatePresence>
            {currentUsers.length === 0 ? (
              <motion.div 
                className="col-span-full text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Tidak ada user ditemukan</p>
              </motion.div>
            ) : (
              currentUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  {/* User Avatar */}
                  <div className="flex flex-col items-center mb-4">
                    <motion.div 
                      className="relative"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
                        user.role === 'admin' 
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' 
                          : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 dark:from-gray-600 dark:to-gray-700 dark:text-gray-100'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.role === 'admin' && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                          <FiShield className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* User Info */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1 truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <FiMail className="w-3 h-3" />
                      <p className="truncate">{user.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.role === 'admin' ? <FiShield className="w-3 h-3" /> : <FiUser className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <motion.button
                      onClick={() => openEditModal(user)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Edit
                    </motion.button>
                    <motion.button
                      onClick={() => openDeleteModal(user)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Hapus
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Menampilkan <span className="font-semibold text-emerald-600">{indexOfFirstUser + 1}</span> - 
                <span className="font-semibold text-emerald-600"> {Math.min(indexOfLastUser, filteredUsers.length)}</span> dari 
                <span className="font-semibold text-emerald-600"> {filteredUsers.length}</span> users
              </p>
              
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === 1 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40'
                  }`}
                  whileHover={currentPage !== 1 ? { scale: 1.1 } : {}}
                  whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
                >
                  <FiChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <motion.button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          currentPage === pageNum 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40'
                  }`}
                  whileHover={currentPage !== totalPages ? { scale: 1.1 } : {}}
                  whileTap={currentPage !== totalPages ? { scale: 0.9 } : {}}
                >
                  <FiChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  {editUser ? "Edit User" : "Tambah User Baru"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {!editUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {editUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password <span className="text-xs text-gray-500">(Kosongkan jika tidak ingin mengubah)</span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium transition-all disabled:opacity-50"
                    >
                      {submitting ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
                              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                                <FiAlertCircle className="w-6 h-6 text-red-600" />
                              </div>
                              
                              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                                Hapus User
                              </h2>
                              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                Apakah Anda yakin ingin menghapus user <span className="font-semibold">{userToDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.
                              </p>
              
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setDeleteModalOpen(false)}
                                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-all"
                                >
                                  Batal
                                </button>
                                <button
                                  onClick={handleDelete}
                                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
