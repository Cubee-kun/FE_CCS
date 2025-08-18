import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon, HomeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(credentials);

    setLoading(false);

    if (!result.success) {
      setError(result.message || "Login gagal");
    } else {
      localStorage.setItem("user", JSON.stringify(result.data.user));

      if (result.data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (result.data.user.role === "user") {
        navigate("/user");
      } else {
        navigate("/");
      }
    }
  };

  const floatingShapes = [
    { icon: "🌿", size: "text-xl", position: "top-1/4 left-1/6" },
    { icon: "🌱", size: "text-lg", position: "top-1/3 right-1/5" },
    { icon: "🍃", size: "text-2xl", position: "bottom-1/4 left-1/4" },
    { icon: "🌲", size: "text-3xl", position: "bottom-1/3 right-1/6" },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-emerald-50 via-white to-teal-50">
       <motion.div 
        className="hidden md:flex md:w-1/2 items-center justify-center p-10 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 z-10"></div>
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
            className={`absolute ${shape.position} ${shape.size} text-emerald-600/30 z-20`}
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
          className="relative z-20 w-full max-w-lg bg-white/90 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-xl border border-white/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.h1 
            className="text-3xl font-bold text-emerald-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Selamat Datang Kembali
          </motion.h1>
          <motion.p 
            className="text-emerald-700/90 mb-6"
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
                <span className="text-emerald-800/90">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Right Side Form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <motion.div 
          className="w-full max-w-md bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-white/20 relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Home Button - Top Right */}
          <Link
            to="/"
            className="absolute top-5 left-5 text-green-700 hover:text-green-900 transition-colors"
            title="Kembali ke Home"
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              style={{ display: "inline-block", transformOrigin: "center" }}
            >
              <HomeIcon className="h-6 w-6" />
            </motion.div>
          </Link>


          {/* Form Header */}
          <motion.div 
            className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-center"
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
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="mb-6 bg-red-50/80 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2 border border-red-100"
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
                <label className="block text-sm font-medium text-gray-700">
                  Alamat Email
                </label>
                <div className="relative">
                  <motion.input
                    type="email"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    required
                    placeholder="email@example.com"
                    className="block w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white placeholder-gray-400"
                    whileFocus={{ 
                      borderColor: "#10B981",
                      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                    }}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700">
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
                    className="block w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-12 transition-all bg-white placeholder-gray-400"
                    whileFocus={{ 
                      borderColor: "#10B981",
                      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                    }}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-emerald-600 transition-colors p-1"
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
                    className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline"
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
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm md:text-base tracking-wide transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 relative overflow-hidden"
                >
                  <motion.span 
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    animate={{ x: isHovering ? "100%" : "-100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span className="relative z-10">Masuk Sekarang</span>
                  )}
                </button>
              </motion.div>
            </form>

            <motion.div 
              className="mt-6 text-center text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p>
                Belum punya akun?{" "}
                <motion.span className="inline-block">
                  <Link
                    to="/register"
                    className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                  >
                    Buat akun baru
                  </Link>
                </motion.span>
              </p>
            </motion.div>

            <motion.div 
              className="mt-6 md:mt-8 border-t border-gray-200 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-xs text-gray-500 text-center">
                © {new Date().getFullYear()} CCS System. All rights reserved.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}