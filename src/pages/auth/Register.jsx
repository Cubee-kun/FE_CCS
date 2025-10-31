import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon, HomeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      setLoading(false);
      return;
    }

    const result = await register(form);
    setLoading(false);
    
    if (!result.success) {
      setError(result.message || "Pendaftaran gagal");
    } else {
      navigate("/login");
    }
  };

  const floatingShapes = [
    { icon: "🌱", size: "text-xl", position: "top-1/4 left-1/6" },
    { icon: "🌿", size: "text-lg", position: "top-1/3 right-1/5" },
    { icon: "🍃", size: "text-2xl", position: "bottom-1/4 left-1/4" },
    { icon: "🌴", size: "text-3xl", position: "bottom-1/3 right-1/6" },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-green-200 via-emerald-100 to-lime-100">
      {/* Left Side Image - Desktop Only */}
      <motion.div 
      className="hidden md:flex md:w-1/2 items-center justify-center p-10 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5 }}
        style={{
          backgroundImage: "url('/images/login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Floating shapes */}
      {floatingShapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute ${shape.position} ${shape.size} text-green-700/30 z-10`}
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
        className="absolute bottom-10 left-10 bg-white/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-lg border border-green-100"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h2 className="text-xl font-bold text-green-800">
          Daftar & Bergabung
        </h2>
        <p className="text-green-700 text-sm">
          Bersama memajukan argopariwisata 
          <motion.span 
            className="inline-block"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌱
          </motion.span>
        </p>
      </motion.div>
    </motion.div>


      {/* Right Side Form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <motion.div 
          className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6 relative border border-green-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Home Button */}
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


          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h2 
              className="text-4xl font-extrabold text-green-900 tracking-tight"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              Buat Akun Baru <motion.span 
                className="inline-block"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >✨</motion.span>
            </motion.h2>
            <motion.p 
              className="text-green-800 text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Bergabung dan mulai berkontribusi
            </motion.p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-red-100/80 text-red-700 px-4 py-2 rounded-lg text-sm text-center shadow-sm border border-red-200"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-green-900 mb-1">
                Nama Lengkap
              </label>
              <motion.input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Masukkan nama lengkap"
                className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white/90"
                whileFocus={{ 
                  borderColor: "#10B981",
                  boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                }}
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-green-900 mb-1">
                Email
              </label>
              <motion.input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="Masukkan email Anda"
                className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white/90"
                whileFocus={{ 
                  borderColor: "#10B981",
                  boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                }}
              />
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-green-900 mb-1">
                Password
              </label>
              <div className="relative">
                <motion.input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Masukkan password"
                  className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none pr-10 bg-white/90"
                  whileFocus={{ 
                    borderColor: "#10B981",
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-green-700 hover:text-green-900 transition-colors"
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
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-medium text-green-900 mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <motion.input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  required
                  placeholder="Ulangi password"
                  className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none pr-10 bg-white/90"
                  whileFocus={{ 
                    borderColor: "#10B981",
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-green-700 hover:text-green-900 transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onHoverStart={() => setIsHovering(true)}
              onHoverEnd={() => setIsHovering(false)}
            >
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden"
              >
                <motion.span 
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: isHovering ? "100%" : "-100%" }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
                {loading ? (
                  <span className="flex items-center justify-center space-x-2 relative z-10">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </span>
                ) : (
                  <span className="relative z-10">Daftar Sekarang</span>
                )}
              </button>
            </motion.div>
          </form>

          <motion.p 
            className="text-center text-sm text-green-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Sudah punya akun?{" "}
            <motion.span className="inline-block">
              <Link
                to="/login"
                className="text-green-900 hover:underline font-medium"
                whileHover={{ scale: 1.05 }}
              >
                Login disini
              </Link>
            </motion.span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}