import { motion } from "framer-motion";
import { FiBarChart2 } from "react-icons/fi";

/**
 * Komponen untuk menampilkan bagian Metode Pengamatan laporan
 */
export default function MethodologySection({ report }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <FiBarChart2 className="text-purple-600 dark:text-purple-400" size={20} />
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Metode Pengamatan</h3>
      </div>

      <div className="space-y-4 text-sm leading-7 text-gray-700 dark:text-gray-300">
        <p>
          Kegiatan monitoring dilakukan pada tanggal{" "}
          <strong className="text-gray-900 dark:text-gray-100">{report.monitoringDate}</strong> pada titik geotagging{" "}
          <strong className="text-gray-900 dark:text-gray-100">({report.lokasiGeotagging})</strong> di area{" "}
          <strong className="text-gray-900 dark:text-gray-100">{report.lokasi}</strong>. Kawasan ini dikelola oleh Balai
          Konservasi Sumber Daya Alam (BKSDA) DKI Jakarta di bawah Kementerian Lingkungan Hidup dan Kehutanan.
        </p>

        <p>
          Dalam pelaksanaan monitoring, digunakan metode kuantitatif lapangan dengan pendekatan observasi langsung. Alat
          yang digunakan pada pengamatan bibit mangrove yang telah ditanam antara lain:
        </p>

        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Pita ukur untuk pengukuran tinggi dan keliling batang</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Jangka sorong untuk pengukuran diameter batang</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Kamera untuk dokumentasi visual kondisi bibit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Laptop untuk pencatatan data elektronik</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Tally sheet untuk pencatatan lapangan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Alat tulis dan peralatan pendukung lainnya</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          Total data monitoring tersedia: <strong>{report.totalMonitoring}</strong> data pengamatan
        </p>
      </div>
    </motion.div>
  );
}
