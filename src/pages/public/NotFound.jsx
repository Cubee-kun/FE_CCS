import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiHome, FiAlertTriangle, FiClock, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          navigate("/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  const progressPercent = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#d1fae5_0%,transparent_35%),radial-gradient(circle_at_85%_15%,#a7f3d0_0%,transparent_30%),linear-gradient(140deg,#f0fdfa_0%,#ecfeff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_15%_20%,#0f172a_0%,transparent_35%),radial-gradient(circle_at_85%_15%,#064e3b_0%,transparent_30%),linear-gradient(140deg,#020617_0%,#0f172a_45%,#111827_100%)] px-4 py-10 flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />

      <motion.div
        className="relative w-full max-w-2xl bg-white/85 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[28px] border border-white/70 dark:border-emerald-800/50 shadow-[0_30px_90px_-35px_rgba(16,185,129,0.45)] p-8 md:p-11 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-12 -right-10 w-40 h-40 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute -bottom-16 -left-12 w-44 h-44 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/20" />

        <motion.div
          className="relative z-10 w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-lg mb-6"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <FiAlertTriangle className="w-10 h-10" />
        </motion.div>

        <h1 className="relative z-10 text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 mb-2">404</h1>
        <p className="relative z-10 text-xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">Halaman Tidak Ditemukan</p>
        <p className="relative z-10 text-gray-600 dark:text-gray-400 mb-6">
          Link yang dibuka tidak tersedia atau sudah dipindahkan.
        </p>

        <div className="relative z-10 max-w-md mx-auto mb-8 p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/80">
          <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-200 font-semibold mb-3">
            <FiClock className="w-4 h-4" />
            Auto back ke home dalam {secondsLeft} detik
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <motion.button
          onClick={() => navigate("/", { replace: true })}
          className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiHome className="w-5 h-5" />
          Kembali Ke Home
          <FiArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
