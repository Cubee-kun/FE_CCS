import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useBlockchain } from "../../contexts/BlockchainContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { 
  FiFileText, FiCalendar, FiShield, FiExternalLink, 
  FiCheck, FiX, FiDownload, FiEye, FiAlertCircle,
  FiRefreshCw, FiFilter, FiSearch, FiChevronLeft, FiChevronRight,
  FiMonitor, FiPackage
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import JSZip from "jszip";

export default function LaporanPage() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [loadingBlockchain, setLoadingBlockchain] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [blockchainVerified, setBlockchainVerified] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { isReady, getWalletStatus } = useBlockchain();

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    try {
      // ✅ Try different endpoint variations
      let response;
      let laporanList = [];

      try {
        response = await api.get("/perencanaan");
        const data = response.data?.data || response.data;
        laporanList = Array.isArray(data) ? data : [];
        console.log('[LaporanPage] Endpoint /perencanaan success:', laporanList.length);
      } catch (err1) {
        console.warn('[LaporanPage] Endpoint /perencanaan failed:', err1.response?.status);
        
        try {
          response = await api.get("/forms/perencanaan");
          const data = response.data?.data || response.data;
          laporanList = Array.isArray(data) ? data : [];
          console.log('[LaporanPage] Endpoint /forms/perencanaan success:', laporanList.length);
        } catch (err2) {
          console.warn('[LaporanPage] Endpoint /forms/perencanaan failed:', err2.response?.status);
          
          // ✅ Generate mock data dengan on-chain dan off-chain mix
          laporanList = generateMockData(30);
          toast.warning("⚠️ Menggunakan mock data untuk demo");
        }
      }
      
      setLaporan(laporanList);
      setError(null);
      setCurrentPage(1);
      
      toast.success(`📊 ${laporanList.length} laporan berhasil dimuat`);
      console.log('[LaporanPage] Laporan loaded:', laporanList.length);
    } catch (err) {
      console.error("[LaporanPage] Fetch error:", err);
      setError("Gagal mengambil data laporan. Menggunakan mock data.");
      setLaporan(generateMockData(30));
      toast.error("❌ Gagal memuat laporan - Menggunakan mock data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Generate mock data dengan on-chain/off-chain mix
  const generateMockData = (count) => {
    const kegiatan = ["Planting Mangrove", "Coral Transplanting"];
    const bibit = ["Mangrove", "Karang", "Bakau", "Cemara Laut"];
    const lokasi = [
      "-2.548922, 118.014968",
      "-2.549500, 118.015500",
      "-2.550000, 118.016000",
      "-2.548000, 118.013000",
      "-2.551000, 118.017000",
    ];
    
    const companies = [
      "PT. Contoh Indonesia",
      "CV. Green Future",
      "PT. Alam Lestari",
      "Yayasan Konservasi",
      "PT. Biru Nusantara",
      "Komunitas Hijau",
    ];

    const data = [];
    for (let i = 1; i <= count; i++) {
      const isOnChain = i % 3 === 0; // 1/3 dari data ada di blockchain
      
      data.push({
        id: i,
        nama_perusahaan: companies[i % companies.length],
        nama_pic: `Person ${i}`,
        narahubung: `+62 812-${String(i).padStart(4, '0')}-xxxx`,
        jenis_kegiatan: kegiatan[i % kegiatan.length],
        jenis_bibit: bibit[i % bibit.length],
        jumlah_bibit: 50 + (i * 5),
        lokasi: lokasi[i % lokasi.length],
        tanggal_pelaksanaan: new Date(2024, 0, Math.min(i, 28)).toISOString().split('T')[0],
        is_implemented: i % 2 === 0,
        // ✅ On-chain data
        blockchain_doc_hash: isOnChain ? `0x${i.toString().padStart(64, '0')}` : null,
        blockchain_tx_hash: isOnChain ? `0x${(i + 1000).toString().padStart(64, '0')}` : null,
        created_at: new Date(2024, 0, Math.min(i, 28)).toISOString(),
        source: isOnChain ? "BLOCKCHAIN" : "DATABASE"
      });
    }
    return data;
  };

  // ✅ Fetch blockchain data untuk dokumen spesifik
  const fetchBlockchainData = async (item) => {
    if (!isReady) {
      toast.warning("⚠️ Blockchain service belum siap");
      return;
    }

    setLoadingBlockchain(true);
    try {
      // ✅ Fetch dari blockchain contract
      const response = await api.get(`/blockchain/document/${item.blockchain_doc_hash}`);
      const blockchainInfo = response.data?.data || {};
      
      setBlockchainData({
        docId: blockchainInfo.docId,
        docHash: blockchainInfo.docHash,
        txHash: item.blockchain_tx_hash,
        timestamp: blockchainInfo.timestamp,
        verified: true,
        status: "✅ Terverifikasi di Blockchain"
      });
      
      toast.success("🔗 Data blockchain berhasil diambil");
    } catch (err) {
      console.error("Blockchain fetch error:", err);
      
      if (item.blockchain_doc_hash) {
        // ✅ Tetap tampilkan data yang ada meskipun gagal fetch
        setBlockchainData({
          docHash: item.blockchain_doc_hash,
          txHash: item.blockchain_tx_hash,
          timestamp: item.created_at,
          verified: true,
          status: "✅ Tersimpan di Blockchain"
        });
        toast.info("📋 Menampilkan data blockchain dari cache");
      } else {
        setBlockchainData(null);
        toast.warning("⚠️ Dokumen belum tersimpan di blockchain");
      }
    } finally {
      setLoadingBlockchain(false);
    }
  };

  // ✅ Toggle status implementasi
  const toggleImplementasiStatus = async (id, currentStatus) => {
    setUpdatingStatus(id);
    try {
      await api.put(`/forms/perencanaan/${id}/status`, {
        is_implemented: !currentStatus
      });
      
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

  // ✅ Generate QR Code dengan blockchain data
  const generateBlockchainQRCode = async (item) => {
    setSelectedLaporan(item);
    setLoadingBlockchain(true);
    
    try {
      const blockchainVerified = !!item.blockchain_doc_hash;
      
      const qrData = {
        type: 'PERENCANAAN_BLOCKCHAIN',
        timestamp: new Date().toISOString(),
        verification: {
          blockchainVerified: blockchainVerified,
          docHash: item.blockchain_doc_hash || null,
          txHash: item.blockchain_tx_hash || null,
          verificationUrl: item.blockchain_doc_hash 
            ? `https://3treesify-ccs.netlify.app/verify/${item.blockchain_doc_hash}`
            : null,
          source: item.source || "DATABASE"
        },
        data: {
          id: item.id,
          nama_perusahaan: item.nama_perusahaan,
          nama_pic: item.nama_pic,
          narahubung: item.narahubung,
          jenis_kegiatan: item.jenis_kegiatan,
          jenis_bibit: item.jenis_bibit,
          jumlah_bibit: item.jumlah_bibit,
          lokasi: item.lokasi,
          tanggal_pelaksanaan: item.tanggal_pelaksanaan,
          is_implemented: item.is_implemented,
        },
      };

      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: blockchainVerified ? '#10b981' : '#3b82f6',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setQrCodeData({
        url: qrUrl,
        data: qrData,
        verified: blockchainVerified
      });
      
      setQrModalOpen(true);
      toast.success(blockchainVerified 
        ? "🔗 QR Code dari Blockchain berhasil dibuat!" 
        : "📱 QR Code dengan data database berhasil dibuat!");
      
    } catch (err) {
      console.error('[LaporanPage] QR generation error:', err);
      toast.error("❌ Gagal membuat QR Code");
    } finally {
      setLoadingBlockchain(false);
    }
  };

  // ✅ Generate PDF dari Laporan
  const generatePDF = async (item) => {
    try {
      toast.info("📄 Membuat PDF...", { autoClose: 2000 });
      
      // Gunakan library html2pdf atau axios untuk fetch dari API
      const { PDFDocument, PDFPage, rgb } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { height } = page.getSize();
      
      let yPosition = height - 50;
      
      // ✅ Header
      page.drawText('LAPORAN PERENCANAAN KEGIATAN', {
        x: 50,
        y: yPosition,
        size: 16,
        color: rgb(16, 185, 129),
      });
      yPosition -= 30;
      
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 550, y: yPosition },
        thickness: 2,
        color: rgb(16, 185, 129),
      });
      yPosition -= 20;
      
      // ✅ Content
      const details = [
        `Perusahaan: ${item.nama_perusahaan}`,
        `PIC: ${item.nama_pic}`,
        `Narahubung: ${item.narahubung}`,
        `Jenis Kegiatan: ${item.jenis_kegiatan}`,
        `Jenis Bibit: ${item.jenis_bibit}`,
        `Jumlah Bibit: ${item.jumlah_bibit} unit`,
        `Lokasi: ${item.lokasi}`,
        `Tanggal Pelaksanaan: ${new Date(item.tanggal_pelaksanaan).toLocaleDateString('id-ID')}`,
        `Status Implementasi: ${item.is_implemented ? 'Sudah' : 'Belum'}`,
        `Status On-Chain: ${item.blockchain_doc_hash ? 'Verified' : 'Pending'}`,
        `Generated: ${new Date().toLocaleString('id-ID')}`,
      ];
      
      details.forEach((detail) => {
        if (yPosition < 50) {
          return; // Skip jika sudah di bawah
        }
        page.drawText(detail, {
          x: 50,
          y: yPosition,
          size: 11,
          color: rgb(0, 0, 0),
        });
        yPosition -= 25;
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `Laporan-${item.nama_perusahaan}-${item.id}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("✅ PDF berhasil diunduh!");
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error("❌ Gagal membuat PDF");
    }
  };

  // ✅ Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeData) return;
    
    const link = document.createElement('a');
    link.download = `QR-BLOCKCHAIN-${selectedLaporan?.nama_perusahaan || 'laporan'}.png`;
    link.href = qrCodeData.url;
    link.click();
    
    // Also download JSON data
    const jsonLink = document.createElement('a');
    jsonLink.download = `QR-DATA-${selectedLaporan?.id}.json`;
    jsonLink.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(qrCodeData.data, null, 2))}`;
    jsonLink.click();
    
    toast.success("📥 QR Code dan data JSON berhasil diunduh!");
  };

  // ✅ Download All as ZIP
  const downloadAllAsZip = async (filteredItems = null) => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const itemsToZip = filteredItems || currentItems;
      
      // Create folder structure
      const laporan_folder = zip.folder('Laporan');
      const qr_folder = zip.folder('QR_Codes');
      const json_folder = zip.folder('JSON_Data');
      
      toast.info(`📦 Membuat ZIP dengan ${itemsToZip.length} file...`, { autoClose: 2000 });
      
      // ✅ Generate untuk setiap laporan
      for (const item of itemsToZip) {
        // 1. Create PDF
        try {
          const { PDFDocument, rgb } = await import('pdf-lib');
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([600, 800]);
          const { height } = page.getSize();
          
          let yPosition = height - 50;
          
          page.drawText('LAPORAN PERENCANAAN', {
            x: 50,
            y: yPosition,
            size: 14,
            color: rgb(16, 185, 129),
          });
          yPosition -= 20;
          
          const details = [
            `Perusahaan: ${item.nama_perusahaan}`,
            `PIC: ${item.nama_pic}`,
            `Kegiatan: ${item.jenis_kegiatan}`,
            `Bibit: ${item.jumlah_bibit} unit`,
            `Lokasi: ${item.lokasi}`,
            `Status: ${item.is_implemented ? 'Implementasi' : 'Perencanaan'}`,
          ];
          
          details.forEach((detail) => {
            if (yPosition > 50) {
              page.drawText(detail, {
                x: 50,
                y: yPosition,
                size: 10,
                color: rgb(0, 0, 0),
              });
              yPosition -= 20;
            }
          });
          
          const pdfBytes = await pdfDoc.save();
          laporan_folder.file(`${item.id}-${item.nama_perusahaan}.pdf`, pdfBytes);
        } catch (err) {
          console.warn(`Gagal membuat PDF untuk item ${item.id}:`, err);
        }
        
        // 2. Generate QR Code
        try {
          const qrData = {
            type: 'PERENCANAAN_BLOCKCHAIN',
            timestamp: new Date().toISOString(),
            verification: {
              blockchainVerified: !!item.blockchain_doc_hash,
              docHash: item.blockchain_doc_hash || null,
              txHash: item.blockchain_tx_hash || null,
            },
            data: {
              id: item.id,
              nama_perusahaan: item.nama_perusahaan,
              jenis_kegiatan: item.jenis_kegiatan,
              jumlah_bibit: item.jumlah_bibit,
            },
          };
          
          const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 400,
            margin: 2,
            color: {
              dark: item.blockchain_doc_hash ? '#10b981' : '#3b82f6',
              light: '#ffffff'
            }
          });
          
          // Convert data URL to blob
          const qrBase64 = qrDataURL.split(',')[1];
          const qrBlob = new Blob([Buffer.from(qrBase64, 'base64')], { type: 'image/png' });
          qr_folder.file(`${item.id}-QR.png`, qrBlob);
          
          // Also save JSON
          json_folder.file(`${item.id}-data.json`, JSON.stringify(qrData, null, 2));
        } catch (err) {
          console.warn(`Gagal membuat QR untuk item ${item.id}:`, err);
        }
      }
      
      // ✅ Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = `Laporan-All-${new Date().getTime()}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(`✅ ZIP dengan ${itemsToZip.length} file berhasil diunduh!`);
    } catch (err) {
      console.error('ZIP creation error:', err);
      toast.error("❌ Gagal membuat file ZIP");
    } finally {
      setDownloadingZip(false);
    }
  };

  // Duplicate toggleImplementasiStatus removed — function is declared earlier in the file.

  // ✅ Filter dan search
  const filteredLaporan = laporan.filter(item => {
    const matchSearch = 
      item.nama_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_pic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = 
      filterStatus === "all" ||
      (filterStatus === "implemented" && item.is_implemented) ||
      (filterStatus === "pending" && !item.is_implemented) ||
      (filterStatus === "blockchain" && item.blockchain_doc_hash);
    
    return matchSearch && matchStatus;
  });

  // ✅ Pagination calculation
  const totalPages = Math.ceil(filteredLaporan.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLaporan.slice(indexOfFirstItem, indexOfLastItem);

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
          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-emerald-500" />
            {filteredLaporan.length} laporan ditemukan • Menampilkan halaman {currentPage} dari {totalPages}
          </p>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Controls */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari perusahaan atau PIC..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filter */}
            <div className="md:col-span-3 relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Semua Status</option>
                <option value="implemented">Sudah Implementasi</option>
                <option value="pending">Belum Implementasi</option>
                <option value="blockchain">Verified Blockchain</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="md:col-span-4 flex gap-2">
              <motion.button
                onClick={fetchLaporan}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiRefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div 
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Laporan</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{laporan.length}</p>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/10 rounded-xl p-4 border border-teal-200 dark:border-teal-700"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">Sudah Implementasi</p>
            <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
              {laporan.filter(l => l.is_implemented).length}
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 border border-blue-200 dark:border-blue-700"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">On-Chain Verified</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {laporan.filter(l => l.blockchain_doc_hash).length}
            </p>
          </motion.div>
        </div>

        {/* ✅ SIMPLIFIED LAPORAN LIST - Hanya nama perusahaan dan blockchain hash */}
        {currentItems.length === 0 ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-2xl p-8 text-center">
            <FiFileText className="w-16 h-16 mx-auto mb-4 text-amber-400" />
            <h3 className="text-xl font-bold mb-2">Tidak Ada Laporan</h3>
            <p>Belum ada data laporan yang sesuai dengan filter Anda</p>
          </div>
        ) : (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Table Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200">
              <div className="md:col-span-1 text-sm">No</div>
              <div className="md:col-span-4 text-sm">Nama Perusahaan</div>
              <div className="md:col-span-5 text-sm">Hash Transaksi Blockchain</div>
              <div className="md:col-span-2 text-sm text-center">Aksi</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-emerald-50/50 dark:hover:bg-gray-700/50 transition-all items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* No */}
                  <div className="md:col-span-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      {indexOfFirstItem + index + 1}
                    </span>
                  </div>

                  {/* Nama Perusahaan */}
                  <div className="md:col-span-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {item.nama_perusahaan}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ID: {item.id}
                    </p>
                  </div>

                  {/* Hash Transaksi Blockchain */}
                  <div className="md:col-span-5">
                    {item.blockchain_tx_hash ? (
                      <div className="flex items-center gap-2 group">
                        <motion.div
                          className="flex items-center gap-2 flex-1 min-w-0"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse"></div>
                          <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                            {item.blockchain_tx_hash.substring(0, 30)}...
                          </code>
                        </motion.div>
                        {item.blockchain_tx_hash && (
                          <motion.a
                            href={`https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiExternalLink className="w-4 h-4" />
                          </motion.a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Belum di-verify</span>
                      </div>
                    )}
                  </div>

                  {/* Aksi */}
                  <div className="md:col-span-2 flex gap-2 justify-center">
                    <motion.button
                      onClick={() => generateBlockchainQRCode(item)}
                      disabled={loadingBlockchain}
                      className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-medium text-sm transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Generate QR Code"
                    >
                      <FiFileText className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => generatePDF(item)}
                      className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 font-medium text-sm transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Download PDF"
                    >
                      <FiDownload className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ✅ PREMIUM PAGINATION */}
        {totalPages > 1 && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Info Text */}
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-400 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Menampilkan <span className="font-bold text-emerald-600">{indexOfFirstItem + 1}</span> - 
                <span className="font-bold text-emerald-600"> {Math.min(indexOfLastItem, filteredLaporan.length)}</span> dari 
                <span className="font-bold text-emerald-600"> {filteredLaporan.length}</span> laporan
              </motion.p>
              
              {/* Pagination Controls */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Previous Button */}
                <motion.button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2.5 rounded-lg transition-all ${
                    currentPage === 1 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40'
                  }`}
                  whileHover={currentPage !== 1 ? { scale: 1.1 } : {}}
                  whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
                >
                  <FiChevronLeft className="w-5 h-5" />
                </motion.button>

                {/* Page Numbers */}
                <div className="flex gap-1 items-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <motion.button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all text-sm ${
                          currentPage === pageNum 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                  
                  {/* Ellipsis if needed */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2 text-gray-400 dark:text-gray-600">...</span>
                  )}
                </div>

                {/* Next Button */}
                <motion.button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2.5 rounded-lg transition-all ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40'
                  }`}
                  whileHover={currentPage !== totalPages ? { scale: 1.1 } : {}}
                  whileTap={currentPage !== totalPages ? { scale: 0.9 } : {}}
                >
                  <FiChevronRight className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Jump to Page */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Halaman:</label>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: totalPages }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bulk Download Button */}
        {filteredLaporan.length > 0 && (
          <motion.div
            className="mt-6 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={() => downloadAllAsZip(filteredLaporan)}
              disabled={downloadingZip}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-bold shadow-xl transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: "0 20px 60px -10px rgba(249, 115, 22, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPackage className="w-5 h-5" />
              <span>
                {downloadingZip 
                  ? `⏳ Membuat ZIP (${currentItems.length} file)...` 
                  : `📦 Download Semua sebagai ZIP (${filteredLaporan.length} file)`
                }
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* ✅ QR Code Modal */}
      <AnimatePresence>
        {qrModalOpen && qrCodeData && (
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
                  <motion.div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      qrCodeData.verified
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    QR Code Blockchain
                  </h2>
                  <p className={`text-sm font-semibold ${
                    qrCodeData.verified
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {qrCodeData.verified ? '✅ Verified dari Blockchain' : '📱 Data dari Database'}
                  </p>
                </div>

                {/* QR Display */}
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

                {/* Download Button */}
                <motion.button
                  onClick={downloadQRCode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium shadow-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiDownload className="w-5 h-5" />
                  <span>Download QR & Data JSON</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}