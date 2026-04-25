import { motion } from "framer-motion";
import { FiDownload, FiX } from "react-icons/fi";

export default function QrCodeModal({ open, qrCodeData, onClose, onDownload }) {
  if (!open || !qrCodeData) {
    return null;
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <motion.div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                qrCodeData.verified
                  ? "bg-gradient-to-br from-green-500 to-emerald-500"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              QR Code Blockchain
            </h2>
            <p
              className={`text-sm font-semibold ${
                qrCodeData.verified
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {qrCodeData.verified ? "Verified dari Blockchain" : "Data dari Database"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-inner mb-6 flex items-center justify-center border-4 border-gray-100">
            <motion.img
              src={qrCodeData.url}
              alt="QR Code"
              className="w-64 h-64 object-contain"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          </div>

          <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 p-4 text-left">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
              QR ini mengarah ke form monitoring
            </p>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">
              Konten QR memuat dokumen verifikasi blockchain dan akan mengarahkan user ke halaman monitoring. Login diperlukan sebelum mengisi form monitoring 6 bulan.
            </p>
          </div>

          <motion.button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium shadow-lg transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiDownload className="w-5 h-5" />
            <span>Download QR (PNG)</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
