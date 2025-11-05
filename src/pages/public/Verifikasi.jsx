// src/pages/Verifikasi.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import { toast } from "react-toastify";
import { FiCamera, FiCheckCircle, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";

export default function Verifikasi() {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const devices = useDevices();
  const [deviceId, setDeviceId] = useState();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleScan = (detected) => {
    if (detected?.length > 0 && detected[0].rawValue) {
      const data = detected[0].rawValue;
      setScanResult(data);
      setScanning(false);
      toast.success("✅ QR Code berhasil dipindai!");
      
      setTimeout(() => {
        if (isAuthenticated) {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          if (user?.role === "admin") {
            navigate("/admin/dashboard");
          } else if (user?.role === "user") {
            navigate("/user/dashboard");
          }
        } else {
          navigate("/login");
        }
      }, 1500);
    }
  };

  const handleError = (error) => {
    console.error("QR Scan Error:", error);
    setError("Gagal membuka kamera. Pastikan izin kamera telah diberikan.");
    toast.error("❌ Gagal membuka kamera!");
  };

  const resetScan = () => {
    setScanResult(null);
    setScanning(true);
    setError(null);
  };

  // ✅ Conditional styling - untuk public mode tambahkan padding top agar tidak tertimpa navbar
  const containerClass = isAuthenticated 
    ? "" // Menggunakan layout dari DashboardLayout/UserLayout (sudah ada padding)
    : "min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-24 pb-12 px-3 sm:px-6 lg:px-8 transition-colors";

  const innerContainerClass = isAuthenticated 
    ? "" // Tidak perlu max-width karena sudah dalam layout
    : "max-w-4xl mx-auto";

  return (
    <div className={containerClass}>
      <div className={innerContainerClass}>
        {/* Header Card */}
        <motion.div 
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-green-100 dark:border-gray-700 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-green-600 to-teal-500 px-6 py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FiCamera className="text-2xl" />
              Verifikasi QR Code
            </h1>
            <p className="text-green-100 mt-1 text-sm">
              Scan QR Code untuk verifikasi data proyek konservasi
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner Card */}
          <motion.div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-green-100 dark:border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <FiCamera className="text-green-600" />
              Kamera Scanner
            </h2>

            {/* Camera Selection */}
            {devices && devices.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pilih Kamera
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  onChange={(e) => setDeviceId(e.target.value)}
                  value={deviceId}
                >
                  <option value="">Kamera Default</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Kamera ${d.deviceId.substring(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scanner Container */}
            {scanning && !error && (
              <div className="relative rounded-xl overflow-hidden border-4 border-green-500 shadow-lg aspect-square bg-gray-900">
                <Scanner
                  onDecode={handleScan}
                  onError={handleError}
                  constraints={{ deviceId: deviceId }}
                  styles={{
                    container: { width: '100%', height: '100%' }
                  }}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-green-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                      className="w-48 h-0.5 bg-green-400"
                      animate={{ y: [-50, 50] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 text-center">
                <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 dark:text-red-300 font-medium mb-4">{error}</p>
                <button
                  onClick={resetScan}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <FiRefreshCw />
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Success State */}
            {scanResult && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                </motion.div>
                <p className="text-green-700 dark:text-green-300 font-semibold mb-2">Scan Berhasil!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isAuthenticated ? "Mengalihkan ke dashboard..." : "Silakan login terlebih dahulu..."}
                </p>
              </div>
            )}
          </motion.div>

          {/* Info Card */}
          <motion.div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-green-100 dark:border-gray-700 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Hasil Scan
              </h2>
              {scanResult ? (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data QR Code:</p>
                  <p className="text-green-800 dark:text-green-200 font-mono text-sm break-all">
                    {scanResult}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                  <FiCamera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Belum ada QR Code yang dipindai
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Cara Menggunakan
              </h3>
              <ol className="space-y-3">
                {["Izinkan akses kamera pada browser Anda", "Arahkan kamera ke QR Code yang ingin dipindai", "Pastikan QR Code berada dalam frame hijau", "Tunggu hingga scan berhasil secara otomatis", isAuthenticated ? "Anda akan dialihkan ke dashboard setelah verifikasi" : "Login terlebih dahulu untuk mengakses fitur lengkap"].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {scanResult ? 1 : 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">QR Dipindai</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg">
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {scanning ? "Aktif" : "Selesai"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Status Scanner</p>
              </div>
            </div>

            {/* Reset Button */}
            {scanResult && (
              <button
                onClick={resetScan}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <FiRefreshCw />
                Scan Ulang
              </button>
            )}
          </motion.div>
        </div>

        {/* Additional Info Card */}
        <motion.div 
          className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-6 border border-blue-200 dark:border-blue-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Informasi Penting
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Pastikan QR Code yang dipindai adalah QR Code resmi dari sistem CCS. 
                QR Code digunakan untuk verifikasi data proyek konservasi dan hanya dapat dipindai oleh pengguna yang terautentikasi.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}