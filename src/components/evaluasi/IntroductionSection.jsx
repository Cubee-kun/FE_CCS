import { motion } from "framer-motion";
import { FiBook } from "react-icons/fi";

/**
 * Komponen untuk menampilkan bagian Pendahuluan laporan
 */
export default function IntroductionSection({ report }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <FiBook className="text-blue-600 dark:text-blue-400" size={20} />
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Pendahuluan</h3>
      </div>

      <div className="space-y-4 text-sm leading-7 text-gray-700 dark:text-gray-300">
        <p>
          Degradasi lahan di Teluk Jakarta menjadi sebuah tantangan lingkungan yang signifikan, disebabkan oleh
          urbanisasi yang cepat, aktivitas industri, dan pertumbuhan populasi yang tak terkendali. Penelitian telah
          menunjukkan bahwa selama periode 43 tahun dari 1972 hingga 2015, tingkat abrasi rata-rata pesisir mencapai
          2,24 meter per tahun, menyebabkan kehilangan total sebesar 76,55 meter (Libriyono et al., 2018). Kerusakan
          ekosistem mangrove menjadi salah satu faktor yang memperparah masalah tersebut. Faktor-faktor seperti
          kebutuhan ekonomi, kegagalan politik, pencemaran, konversi hutan mangrove tanpa mempertimbangkan faktor
          lingkungan, serta penebangan berlebihan, menjadi penyebab umum kerusakan hutan mangrove (Farhaby dan Anwar
          2021). Meskipun memiliki peran penting untuk keberlanjutan di wilayah pesisir, hutan mangrove di Jakarta dan
          Kepulauan Seribu mengalami kondisi yang semakin memburuk.
        </p>

        <p>
          Mangrove sebagai jenis pohon yang hidup di kawasan pasang surut air laut, memiliki peran yang sangat vital
          dalam ekosistem pesisir. Selain melindungi pantai dari abrasi dan intrusi air laut, mangrove juga memecah
          gelombang, menyediakan habitat bagi berbagai jenis satwa, serta menjaga keseimbangan ekologi perairan.
          Terkait dengan isu perubahan iklim, Donato et al., (2011) dan Estrada, Soares, Fernadez, & de Almeida
          (2015) mengidentifikasi bahwa hutan mangrove memiliki simpanan karbon yang relatif tinggi.
        </p>

        <p>
          Kawasan mangrove Angke Kapuk, sebagai salah satu hutan mangrove di Teluk Jakarta, memiliki peran yang sangat
          penting dalam melindungi pesisir dari abrasi, intrusi air laut, dan banjir. Namun, kawasan ini menghadapi
          ancaman serius akibat aktivitas manusia yang tidak terencana dan kenaikan permukaan laut sebagai dampak
          perubahan iklim. Untuk memulihkan fungsi ekosistem mangrove yang optimal, diperlukan upaya perbaikan dan
          pemeliharaan, termasuk melalui kegiatan restorasi.
        </p>

        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Konteks Proyek:</p>
          <p>
            <strong className="text-gray-900 dark:text-gray-100">{report.namaPerusahaan}</strong> mempunyai CSR Program
            dan berkontribusi terhadap upaya restorasi coastal ecosystem terutama di Area Teluk Jakarta melalui kegiatan
            <strong className="text-gray-900 dark:text-gray-100"> {report.jenisKegiatan}</strong>. Pada tanggal{" "}
            <strong className="text-gray-900 dark:text-gray-100">{report.tanggalPelaksanaan}</strong> telah dilakukan
            penanaman mangrove sejumlah <strong className="text-gray-900 dark:text-gray-100">{report.jumlahBibit}</strong>{" "}
            individu di titik geotagging({" "}
            <strong className="text-gray-900 dark:text-gray-100">{report.lokasiGeotagging}</strong>) pada area{" "}
            <strong className="text-gray-900 dark:text-gray-100">{report.lokasi}</strong>. Evaluasi berkala untuk melihat
            persentase tumbuh, parameter pertumbuhan (tinggi dan diameter batang), dan kondisi kesehatan bibit menjadi
            kunci dalam memastikan keberhasilan upaya restorasi tersebut.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
