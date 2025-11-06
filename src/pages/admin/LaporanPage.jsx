import { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { 
  FiFileText, FiCalendar, FiLink, FiShield, FiExternalLink, 
  FiCheckCircle, FiCheck, FiX, FiDownload, FiEye 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { toast } from "react-toastify";

export default function LaporanPage() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    try {
      const response = await api.get("/forms/perencanaan"); // Fetch all perencanaan
      const data = response.data?.data || response.data;
      setLaporan(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Gagal mengambil data laporan.");
      setLaporan([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle status implementasi
  const toggleImplementasiStatus = async (id, currentStatus) => {
    setUpdatingStatus(id);
    try {
      await api.put(`/forms/perencanaan/${id}/status`, {
        is_implemented: !currentStatus
      });
      
      // Update local state
      setLaporan(laporan.map(item => 
        item.id === id ? { ...item, is_implemented: !currentStatus } : item
      ));
      
      toast.success(!currentStatus ? "✅ Ditandai sebagai sudah implementasi" : "Status implementasi dibatalkan");
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("❌ Gagal mengubah status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ✅ Generate QR Code
  const generateQRCode = async (item) => {
    setSelectedLaporan(item);
    
    // Data yang akan di-encode ke QR
    const qrData = {
      id: item.id,
      type: 'PERENCANAAN',
      nama_perusahaan: item.nama_perusahaan,
      nama_pic: item.nama_pic,
      jenis_bibit: item.jenis_bibit,
      jumlah_bibit: item.jumlah_bibit,
      tanggal_pelaksanaan: item.tanggal_pelaksanaan,
      blockchain_tx_hash: item.blockchain_tx_hash || null,
      blockchain_doc_hash: item.blockchain_doc_hash || null,
      timestamp: new Date().toISOString()
    };

    try {
      // Generate QR Code as Data URL
      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: '#10b981', // emerald-500
          light: '#ffffff'
        }
      });
      
      setQrCodeUrl(qrUrl);
      setQrModalOpen(true);
      toast.success("📱 QR Code berhasil dibuat!");
    } catch (err) {
      console.error("QR generation error:", err);
      toast.error("❌ Gagal membuat QR Code");
    }
  };

  // ✅ Download QR Code
  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `QR-${selectedLaporan?.nama_perusahaan || 'laporan'}.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success("📥 QR Code berhasil diunduh!");
  };

  if (loading) return <LoadingSpinner show={true} message="Memuat laporan..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
            <FiFileText className="text-emerald-600" /> 
            Laporan Perencanaan
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola status implementasi dan generate QR Code untuk verifikasi
          </p>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {laporan.length === 0 ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-2xl p-8 text-center">
            <FiFileText className="w-16 h-16 mx-auto mb-4 text-amber-400" />
            <h3 className="text-xl font-bold mb-2">Belum Ada Laporan</h3>
            <p>Buat perencanaan terlebih dahulu untuk melihat laporan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {laporan.map((item, index) => (
              <motion.div
                key={item.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg flex-shrink-0">
                          <FiFileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                              {item.nama_perusahaan}
                            </h3>
                            {item.blockchain_tx_hash && (
                              <div className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center gap-1">
                                <FiShield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                  Blockchain
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">PIC:</span>
                              <span>{item.nama_pic}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Jenis Bibit:</span>
                              <span>{item.jenis_bibit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Jumlah:</span>
                              <span>{item.jumlah_bibit} bibit</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiCalendar className="w-3 h-3" />
                              <span>
                                {new Date(item.tanggal_pelaksanaan).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Blockchain Info (Compact) */}
                      {item.blockchain_doc_hash && (
                        <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-3">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Document Hash:</p>
                              <code className="block text-xs font-mono text-purple-700 dark:text-purple-300 truncate">
                                {item.blockchain_doc_hash}
                              </code>
                            </div>
                            {item.blockchain_tx_hash && (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium whitespace-nowrap"
                              >
                                <FiExternalLink className="w-3 h-3" />
                                <span>Etherscan</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-3 lg:w-64">
                      {/* Status Implementasi */}
                      <motion.button
                        onClick={() => toggleImplementasiStatus(item.id, item.is_implemented)}
                        disabled={updatingStatus === item.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                          item.is_implemented
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                            item.is_implemented 
                              ? 'border-white bg-white/20' 
                              : 'border-gray-400 dark:border-gray-500'
                          }`}>
                            {item.is_implemented && <FiCheck className="w-4 h-4 text-white" />}
                          </div>
                          <span className="text-sm">
                            {updatingStatus === item.id ? 'Updating...' : 'Implementasi'}
                          </span>
                        </div>
                        {item.is_implemented && <FiCheckCircle className="w-5 h-5" />}
                      </motion.button>

                      {/* Generate QR Button */}
                      <motion.button
                        onClick={() => generateQRCode(item)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg transition-all"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(59, 130, 246, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span>Generate QR</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Bottom Badge */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    item.jenis_kegiatan === 'Planting Mangrove'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : item.jenis_kegiatan === 'Coral Transplanting'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {item.jenis_kegiatan}
                  </span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {item.id}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ QR Code Modal */}
      <AnimatePresence>
        {qrModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    QR Code
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedLaporan?.nama_perusahaan}
                  </p>
                </div>

                {/* QR Code Display */}
                <div className="bg-white p-6 rounded-xl shadow-inner mb-6 flex items-center justify-center">
                  {qrCodeUrl && (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-72 h-72 object-contain"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-2">
                    📱 Cara Menggunakan
                  </h4>
                                    <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                                      <li>Scan QR code dengan aplikasi scanner</li>
                                      <li>Verifikasi data perencanaan yang muncul</li>
                                      <li>Cek keaslian melalui blockchain hash</li>
                                    </ol>
                                  </div>
                  
                                  {/* Download Button */}
                                  <button
                                    onClick={downloadQRCode}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium shadow-lg transition-all"
                                  >
                                    <FiDownload className="w-5 h-5" />
                                    <span>Download QR Code</span>
                                  </button>
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }