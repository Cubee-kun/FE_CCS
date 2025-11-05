import { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FiFileText, FiCalendar, FiLink, FiShield, FiExternalLink } from "react-icons/fi";
import { motion } from "framer-motion";

export default function LaporanPage() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const response = await api.get("/laporan");
        const data = response.data?.data || response.data;
        setLaporan(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        if (err.response?.status === 404 || err.response?.status === 405) {
          setError("Endpoint laporan belum tersedia di backend.");
        } else {
          setError("Gagal mengambil data laporan.");
        }
        setLaporan([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  if (loading) return <LoadingSpinner show={true} message="Memuat laporan..." />;
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
          <FiFileText className="text-green-600" /> 
          Laporan Kegiatan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Dokumen dengan verifikasi blockchain
        </p>
      </motion.div>

      {laporan.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg p-6 text-center">
          Tidak ada laporan tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {laporan.map((item) => (
            <motion.div
              key={item.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border border-gray-100 dark:border-gray-700"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {item.judul || item.nama_perusahaan}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      {item.tanggal
                        ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
                
                {/* ✅ Blockchain Badge */}
                {item.blockchain_tx_hash && (
                  <div className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center gap-1">
                    <FiShield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {item.deskripsi || "Tidak ada deskripsi"}
              </p>

              {/* ✅ Blockchain Info */}
              {item.blockchain_doc_hash && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200 text-sm mb-3 flex items-center gap-2">
                    <FiLink className="w-4 h-4" />
                    Blockchain Verification
                  </h4>
                  
                  {/* Document Hash */}
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Document Hash:</p>
                    <code className="block bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono break-all text-purple-700 dark:text-purple-300">
                      {item.blockchain_doc_hash}
                    </code>
                  </div>

                  {/* Transaction Link */}
                  {item.blockchain_tx_hash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium mt-2 group/link"
                    >
                      <FiExternalLink className="w-3 h-3" />
                      <span>Lihat di Etherscan</span>
                      <motion.span
                        className="opacity-0 group-hover/link:opacity-100"
                        initial={{ x: -5 }}
                        whileHover={{ x: 0 }}
                      >
                        →
                      </motion.span>
                    </a>
                  )}
                </div>
              )}

              {/* Type Badge */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  item.jenis_kegiatan === 'Planting Mangrove'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : item.jenis_kegiatan === 'Coral Transplanting'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {item.jenis_kegiatan || item.type || 'General'}
                </span>
                
                {!item.blockchain_tx_hash && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Belum di-blockchain
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}