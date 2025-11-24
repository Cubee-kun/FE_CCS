import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon, HomeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FiAlertTriangle, FiLogOut } from "react-icons/fi";
import api from "../../api/axios";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [deviceConflict, setDeviceConflict] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDeviceConflict(false);
    setLoading(true);

    console.log('[Login] Attempting login with email:', credentials.email);

    const result = await login(credentials);

    setLoading(false);

    if (!result.success) {
<<<<<<< HEAD
      // ✅ Device conflict
=======
>>>>>>> 6cb1bb9f18ae787f21e585de8cfb287dff3a09dc
      if (result.code === 'DEVICE_CONFLICT') {
        setDeviceConflict(true);
        setSessionInfo(result.sessionInfo || {});
        setError(result.message);
<<<<<<< HEAD
      }
      // ✅ Invalid credentials
      else if (result.code === 'INVALID_CREDENTIALS') {
        setError(result.message);
        console.warn('[Login] Invalid credentials - please check email and password');
      }
      // ✅ Other errors
      else {
=======
      } else if (result.code === 'INVALID_CREDENTIALS') {
        setError(result.message);
        console.warn('[Login] Invalid credentials - please check email and password');
      } else {
>>>>>>> 6cb1bb9f18ae787f21e585de8cfb287dff3a09dc
        setError(result.message);
        console.error('[Login] Login error:', result.message);
      }
    } else {
      // ✅ Login berhasil
      localStorage.setItem("user", JSON.stringify(result.data.user));
      console.log('[Login] ✅ Login successful');

      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (result.data.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (result.data.user.role === "user") {
        navigate("/user/dashboard", { replace: true });
      }
    }
  };

  const handleForceLogout = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await login({ 
        ...credentials, 
        forceLogout: true
      });

      setLoading(false);

      if (result.success) {
        localStorage.setItem("user", JSON.stringify(result.data.user));
        
        if (from && from !== '/login') {
          navigate(from, { replace: true });
        } else if (result.data.user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (result.data.user.role === "user") {
          navigate("/user/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(result.message || "Gagal logout perangkat lain");
      }
    } catch (err) {
      setLoading(false);
      setError("Terjadi kesalahan saat logout perangkat lain");
    }
  };

  const floatingShapes = [
    { icon: "🌿", size: "text-xl", position: "top-1/4 left-1/6" },
    { icon: "🌱", size: "text-lg", position: "top-1/3 right-1/5" },
    { icon: "🍃", size: "text-2xl", position: "bottom-1/4 left-1/4" },
    { icon: "🌲", size: "text-3xl", position: "bottom-1/3 right-1/6" },
  ];

  if (loading && !deviceConflict) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Left Side - Desktop Only */}
      <motion.div 
        className="hidden md:flex md:w-1/2 items-center justify-center p-10 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 dark:from-emerald-500/5 dark:to-teal-600/5 z-10"></div>
        <motion.img
          src="/images/login-bg.jpg"
          alt="Login background"
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
        
        {floatingShapes.map((shape, index) => (
          <motion.div
            key={index}
            className={`absolute ${shape.position} ${shape.size} text-emerald-600/30 dark:text-emerald-400/20 z-20`}
            animate={{
              y: [0, (Math.random() - 0.5) * 40],
              x: [0, (Math.random() - 0.5) * 40],
              rotate: [0, Math.random() * 360],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            {shape.icon}
          </motion.div>
        ))}

        <motion.div 
          className="relative z-20 w-full max-w-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 transition-all"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.h1 
            className="text-3xl font-bold text-emerald-800 dark:text-emerald-200 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Selamat Datang Kembali
          </motion.h1>
          <motion.p 
            className="text-emerald-700/90 dark:text-emerald-300/90 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Sistem Manajemen CCS yang aman dan efisien untuk kebutuhan bisnis Anda
          </motion.p>
          <div className="space-y-4">
            {[
              { icon: "🔒", text: "Autentikasi aman dengan enkripsi" },
              { icon: "⚡", text: "Proses cepat dan responsif" },
              { icon: "🌱", text: "Ramah lingkungan - paperless" }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <motion.span 
                  className="text-xl"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {item.icon}
                </motion.span>
                <span className="text-emerald-800/90 dark:text-emerald-200/90">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Right Side Form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12 relative">
        {/* Home Button */}
        <Link
          to="/"
          className="absolute top-6 right-6 md:top-8 md:right-8 z-10 group"
          title="Kembali ke Beranda"
        >
          <motion.div
            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg border border-emerald-200 dark:border-emerald-700/50 hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05, x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ x: [-2, 0, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <HomeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <span className="hidden sm:inline text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Beranda
            </span>
          </motion.div>
        </Link>

        <motion.div 
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50 transition-all"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Form Header */}
          <motion.div 
            className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-700 dark:to-teal-600 p-6 text-center transition-all"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h2 
              className="text-2xl font-bold text-white"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              Masuk ke Akun Anda
            </motion.h2>
            <motion.p 
              className="text-white/90 text-sm mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Silakan masuk untuk mengakses dashboard
            </motion.p>
          </motion.div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            {/* Device Conflict Warning */}
            <AnimatePresence>
              {deviceConflict && (
                <motion.div
                  className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <FiAlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">
                        ⚠️ Akun Sudah Login di Perangkat Lain
                      </h3>
                      <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                        Akun Anda sudah login di perangkat lain. Untuk keamanan, hanya 1 perangkat yang bisa aktif.
                      </p>
                      
                      {/* Session Info */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 border border-amber-200 dark:border-amber-800">
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Perangkat:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {sessionInfo?.lastDevice || 'Perangkat lain'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Terakhir aktif:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {sessionInfo?.lastLogin || 'Baru saja'}
                            </span>
                          </div>
                          {sessionInfo?.ipAddress && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">IP Address:</span>
                              <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                                {sessionInfo.ipAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                        Apakah Anda ingin logout dari perangkat tersebut dan login di perangkat ini?
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => {
                        setDeviceConflict(false);
                        setError("");
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-all text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Batal
                    </motion.button>
                    <motion.button
                      onClick={handleForceLogout}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all text-sm shadow-md"
                      whileHover={{ scale: 1.02, boxShadow: "0 8px 30px -10px rgba(239, 68, 68, 0.5)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout Perangkat Lain</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Normal Error Message */}
            <AnimatePresence>
              {error && !deviceConflict && (
                <motion.div 
                  className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start space-x-2 border border-red-100 dark:border-red-800"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex-1 text-center">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alamat Email
                </label>
                <motion.input
                  type="email"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                  required
                  placeholder="email@example.com"
                  className="block w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  whileFocus={{ 
                    borderColor: "#10B981",
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                  }}
                />
              </motion.div>

              {/* Password */}
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <motion.input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    required
                    placeholder="••••••••"
                    className="block w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-12 transition-all bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    whileFocus={{ 
                      borderColor: "#10B981",
                      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                    }}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>
                <motion.div 
                  className="flex justify-end pt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    to="/forgot-password"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline"
                  >
                    Lupa password?
                  </Link>
                </motion.div>
              </motion.div>

                            {/* Submit */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.7 }}
                              onHoverStart={() => setIsHovering(true)}
                              onHoverEnd={() => setIsHovering(false)}
                            >
                              <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 dark:from-emerald-700 dark:to-teal-600 dark:hover:from-emerald-800 dark:hover:to-teal-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={!loading ? { scale: 1.02, boxShadow: "0 10px 35px -5px rgba(16, 185, 129, 0.4)" } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                              >
                                {loading ? (
                                  <>
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                    <span>Memproses...</span>
                                  </>
                                ) : (
                                  <span>Masuk</span>
                                )}
                              </button>
                            </motion.div>
              
                            {/* Sign Up Link */}
                            <motion.p 
                              className="text-center text-sm text-gray-600 dark:text-gray-400"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.8 }}
                            >
                              Belum punya akun?{" "}
                              <Link
                                to="/register"
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold hover:underline"
                              >
                                Daftar di sini
                              </Link>
                            </motion.p>
                          </form>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                );
              }