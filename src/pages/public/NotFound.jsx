import { motion } from "framer-motion";
import { FiHome, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-10 flex items-center justify-center">
      <motion.div
        className="w-full max-w-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-3xl border border-white/60 dark:border-gray-700/60 shadow-2xl p-8 md:p-10 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-lg mb-6"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <FiAlertTriangle className="w-10 h-10" />
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-gray-100 mb-2">404</h1>
        <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">Halaman Tidak Ditemukan</p>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Link yang dibuka tidak tersedia atau sudah dipindahkan.
        </p>

        <motion.button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiHome className="w-5 h-5" />
          Kembali Ke Home
        </motion.button>
      </motion.div>
    </div>
  );
}
