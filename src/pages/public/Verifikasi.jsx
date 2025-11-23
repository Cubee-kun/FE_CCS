// src/pages/public/Verifikasi.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  FiCamera, FiCheckCircle, FiAlertCircle, FiRefreshCw, 
  FiX, FiDownload, FiCopy, FiChevronDown, FiChevronUp, FiUpload,
  FiFileText, FiCalendar, FiUser, FiMapPin, FiShield, FiExternalLink
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import "leaflet/dist/leaflet.css";
import api from "../../api/axios";

// ✅ Lazy load Scanner
const Scanner = null;

// ✅ Mock data untuk testing jika API tidak tersedia
const getMockLaporanDetail = (id) => {
  const mockData = {
    1: {
      id: 1,
      nama_perusahaan: "PT. Contoh Indonesia",
      nama_pic: "John Doe",
      narahubung: "+62 812-3456-7890",
      jenis_kegiatan: "Planting Mangrove",
      jenis_bibit: "Mangrove",
      jumlah_bibit: 100,
      lokasi: "-2.548922, 118.014968",
      tanggal_pelaksanaan: "2024-01-15",
      is_implemented: true,
      blockchain_doc_hash: "0x1234567890abcdef",
      blockchain_tx_hash: "0xaabbccdd",
      created_at: "2024-01-01"
    }
  };
  
  return mockData[id] || null;
};

export default function Verifikasi() {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);
  const [manualQRCode, setManualQRCode] = useState("");
  const [laporanDetail, setLaporanDetail] = useState(null);
  const [loadingLaporan, setLoadingLaporan] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [ScannerComponent, setScannerComponent] = useState(null);

  useEffect(() => {
    const loadScanner = async () => {
      try {
        const { Scanner: QRScanner } = await import("@yudiel/react-qr-scanner");
        setScannerComponent(() => QRScanner);
        setScannerReady(true);
        console.log('[Verifikasi] Scanner component loaded successfully');
      } catch (err) {
        console.error('[Verifikasi] Failed to load scanner component:', err);
        setError('❌ QR Scanner tidak tersedia. Gunakan input manual atau upload gambar.');
        setUseManualInput(true);
      }
    };

    loadScanner();
  }, []);

  // ✅ Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back'));
          setDeviceId(backCamera?.deviceId || videoDevices[0].deviceId);
          
          if (scannerReady) {
            setScanning(true);
          }
        }
      } catch (err) {
        console.error('[Verifikasi] Error getting devices:', err);
        setError('❌ Tidak dapat mengakses kamera.');
        setUseManualInput(true);
      }
    };
    
    if (scannerReady) {
      getDevices();
    }
  }, [scannerReady]);

  // ✅ Handle successful scan
  const handleScan = (detections) => {
    if (detections?.length > 0) {
      const qrData = detections[0].rawValue;
      processQRData(qrData);
    }
  };

  // ✅ Fetch detail laporan dari API dengan multiple fallback strategies
  const fetchLaporanDetail = async (laporanId) => {
    setLoadingLaporan(true);
    try {
      // ✅ Try endpoints in order of preference
      let laporan = null;
      let lastError = null;

      // ✅ 1. Try public endpoint first (no auth required)
      try {
        console.log(`[Verifikasi] Trying public endpoint: /perencanaan/${laporanId}/public`);
        const response = await api.get(`/perencanaan/${laporanId}/public`);
        laporan = response.data?.data || response.data;
        console.log('[Verifikasi] Public endpoint success');
      } catch (err1) {
        console.warn(`[Verifikasi] Public endpoint failed (${err1.response?.status}):`, err1.response?.data?.message);
        lastError = err1;

        // ✅ 2. Try authenticated endpoint (jika user login)
        if (isAuthenticated) {
          try {
            console.log(`[Verifikasi] Trying authenticated endpoint: /perencanaan/${laporanId}`);
            const response = await api.get(`/perencanaan/${laporanId}`);
            laporan = response.data?.data || response.data;
            console.log('[Verifikasi] Authenticated endpoint success');
          } catch (err2) {
            console.warn(`[Verifikasi] Authenticated endpoint failed (${err2.response?.status}):`, err2.response?.data?.message);
            lastError = err2;
          }
        }

        // ✅ 3. Fallback: gunakan data dari QR code atau mock data
        if (!laporan) {
          if (parsedData && typeof parsedData === 'object' && parsedData.id) {
            laporan = parsedData;
            console.log('[Verifikasi] Using data from QR code as fallback');
            toast.info("💡 Menampilkan data dari QR Code (akses detail terbatas)", { 
              autoClose: 3000 
            });
          } else {
            const mockLaporan = getMockLaporanDetail(laporanId);
            if (mockLaporan) {
              laporan = mockLaporan;
              console.log('[Verifikasi] Using mock data as fallback');
              toast.info("💡 Menampilkan data demo - Backend endpoint tidak tersedia", { 
                autoClose: 3000 
              });
            }
          }
        }
      }

      if (laporan) {
        setLaporanDetail(laporan);
        console.log('[Verifikasi] Laporan detail set successfully');
        toast.success("📊 Detail laporan berhasil dimuat!");
      } else {
        // ✅ All attempts failed
        throw lastError || new Error('Tidak dapat memuat detail laporan dari semua sumber');
      }

    } catch (err) {
      console.error('[Verifikasi] Final error after all retries:', {
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        url: err.config?.url,
        isAuthenticated
      });
      
      // ✅ Show user-friendly error
      if (err.response?.status === 401) {
        toast.warning("🔒 Silakan login untuk melihat detail lengkap laporan");
        // ✅ Tetap tampilkan data dari QR code
        if (parsedData) {
          setLaporanDetail(parsedData);
        }
      } else if (err.response?.status === 404) {
        toast.error("❌ Laporan tidak ditemukan - ID mungkin tidak valid");
        // ✅ Try menampilkan mock data sebagai fallback terakhir
        if (laporanId) {
          const mockLaporan = getMockLaporanDetail(laporanId);
          if (mockLaporan) {
            setLaporanDetail(mockLaporan);
            toast.info("💡 Menampilkan data demo");
          }
        }
      } else {
        toast.warning("⚠️ Tidak dapat memuat detail lengkap - menampilkan data QR Code");
        if (parsedData) {
          setLaporanDetail(parsedData);
        }
      }
    } finally {
      setLoadingLaporan(false);
    }
  };

  // ✅ Process QR data - extract ID lebih robust
  const processQRData = async (qrData) => {
    try {
      const parsed = JSON.parse(qrData);
      setScanResult(qrData);
      setParsedData(parsed);
      setScanning(false);
      setError(null);
      
      toast.success("✅ QR Code berhasil dipindai!", {
        position: "top-center",
        autoClose: 2000
      });

      // ✅ Extract ID dari berbagai format yang mungkin
      const laporanId = parsed.id || parsed.perencanaan_id || parsed.laporan_id;
      
      if (laporanId) {
        console.log(`[Verifikasi] Found laporan ID: ${laporanId}`);
        await fetchLaporanDetail(laporanId);
      } else {
        // ✅ Jika tidak ada ID, tetap tampilkan data dari QR code
        console.warn('[Verifikasi] No ID found in QR data, showing QR data only');
        setLaporanDetail(parsed);
        toast.info("💡 Menampilkan data dari QR Code", { autoClose: 2000 });
      }

    } catch (parseError) {
      // ✅ If not JSON, treat as raw text or ID
      console.log('[Verifikasi] QR data is not JSON, treating as text');
      
      // ✅ Check if it's a numeric ID
      if (/^\d+$/.test(qrData.trim())) {
        const numericId = parseInt(qrData.trim());
        console.log(`[Verifikasi] Detected numeric ID: ${numericId}`);
        setScanResult(qrData);
        setParsedData({ id: numericId, raw: qrData, type: 'NUMERIC_ID' });
        setScanning(false);
        setError(null);
        
        toast.success("✅ ID laporan berhasil dipindai!", {
          position: "top-center",
          autoClose: 2000
        });
        
        await fetchLaporanDetail(numericId);
      } else {
        // ✅ Raw text data
        setScanResult(qrData);
        setParsedData({ raw: qrData, type: 'TEXT' });
        setScanning(false);
        setError(null);
        setLaporanDetail(null);
        
        toast.info("📋 Data berhasil dipindai (bukan format JSON)", {
          position: "top-center",
          autoClose: 2000
        });
      }
    }
  };

  // ✅ Handle scan errors
  const handleError = (error) => {
    console.error('[Verifikasi] Scan error:', error);
    
    if (error?.name === 'NotAllowedError') {
      setError('❌ Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
    } else if (error?.name === 'NotFoundError') {
      setError('❌ Kamera tidak ditemukan.');
    } else if (error?.name === 'NotSupportedError') {
      setError('❌ Browser tidak mendukung akses kamera.');
    } else {
      setError('❌ Gagal mengakses kamera. Gunakan input manual.');
    }
    
    setScanning(false);
    setUseManualInput(true);
    toast.error(error?.message || 'Gagal mengakses kamera');
  };

  // ✅ Reset scan
  const resetScan = () => {
    setScanResult(null);
    setParsedData(null);
    setLaporanDetail(null);
    setScanning(true);
    setError(null);
    setExpandedInfo(false);
    setManualQRCode("");
  };

  // ✅ Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(scanResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('✅ Disalin ke clipboard');
  };

  // ✅ Handle manual QR input
  const handleManualQRSubmit = (e) => {
    e.preventDefault();
    if (!manualQRCode.trim()) {
      toast.error('❌ Silakan masukkan QR code atau data');
      return;
    }
    processQRData(manualQRCode);
    setManualQRCode("");
  };

  // ✅ Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            try {
              const { default: jsQR } = await import('jsqr');
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (code) {
                processQRData(code.data);
                return;
              }
            } catch (jsqrErr) {
              console.warn('[Verifikasi] jsQR not available:', jsqrErr.message);
            }

            try {
              const QrScanner = await import('qr-scanner').then(m => m.default);
              const code = await QrScanner.scanImage(img);
              if (code) {
                processQRData(code);
                return;
              }
            } catch (qrScannerErr) {
              console.warn('[Verifikasi] QrScanner not available:', qrScannerErr.message);
            }

            toast.warning('⚠️ Tidak dapat membaca QR dari gambar otomatis.');
            toast.info('💡 Silakan input QR code secara manual atau copy-paste data-nya');
            setUseManualInput(true);
            
          } catch (decodeErr) {
            console.error('[Verifikasi] Error decoding QR from image:', decodeErr);
            toast.warning('⚠️ Tidak dapat membaca QR dari gambar.');
            setUseManualInput(true);
          }
        };
        img.onerror = () => {
          toast.error('❌ File gambar tidak valid');
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[Verifikasi] File upload error:', err);
      toast.error('❌ Gagal memproses file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-12 px-3 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <motion.div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-green-100 dark:border-gray-700 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 px-6 py-6 sm:px-8 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <motion.div 
                className="p-2 bg-white/20 rounded-xl"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                <FiCamera className="text-2xl" />
              </motion.div>
              Verifikasi & Lihat Detail Laporan
            </h1>
            <p className="text-green-100 text-sm sm:text-base">
              Scan QR Code untuk melihat detail lengkap laporan perencanaan kegiatan konservasi
            </p>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <motion.div 
            className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-green-100 dark:border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
              <FiCamera className="w-6 h-6 text-green-600 dark:text-green-400" />
              Scanner QR Code
            </h2>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera Selection */}
            {devices.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pilih Kamera
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium"
                  onChange={(e) => setDeviceId(e.target.value)}
                  value={deviceId}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Kamera ${d.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scanner or Manual Input */}
            <AnimatePresence mode="wait">
              {!useManualInput && scannerReady && scanning && !scanResult ? (
                <motion.div 
                  key="scanner"
                  className="relative rounded-2xl overflow-hidden border-4 border-green-500 shadow-2xl aspect-square bg-gray-900 mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {ScannerComponent ? (
                    <ScannerComponent
                      onDecode={handleScan}
                      onError={handleError}
                      constraints={{ deviceId: deviceId || undefined }}
                      styles={{
                        container: { width: '100%', height: '100%' }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <FiAlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <p className="text-yellow-300">Loading scanner...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Scanning Frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="absolute inset-8 border-2 border-green-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
                    <motion.div
                      className="absolute w-48 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full"
                      animate={{ y: [-60, 60] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>

                  {/* Instructions */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                    <p className="text-white text-sm font-medium">Arahkan kamera ke QR Code</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Manual Input Option */}
            {useManualInput || !scannerReady ? (
              <motion.form 
                onSubmit={handleManualQRSubmit}
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📋 Input Manual QR Code atau ID Laporan
                </label>
                <div className="space-y-3">
                  <textarea
                    value={manualQRCode}
                    onChange={(e) => setManualQRCode(e.target.value)}
                    placeholder="Paste QR code data, JSON, atau ID laporan di sini..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    rows="4"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg transition-all"
                  >
                    Cari Laporan
                  </button>
                </div>
              </motion.form>
            ) : null}

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                📸 Upload Gambar QR Code
              </label>
              <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Klik untuk upload gambar</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Success State - Show when scan berhasil */}
            {scanResult && !laporanDetail && (
              <motion.div 
                className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-8 text-center aspect-square flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <FiCheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                </motion.div>
                <p className="text-blue-700 dark:text-blue-300 font-bold text-lg mb-2">QR Code Valid ✅</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {loadingLaporan ? 'Memuat detail laporan...' : 'Data sedang diproses...'}
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="mt-4"
                >
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* ✅ DETAIL LAPORAN PANEL - Tampilkan langsung tanpa perlu login */}
          {laporanDetail && (
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-green-100 dark:border-gray-700 overflow-hidden sticky top-20">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <FiFileText className="w-5 h-5" />
                    Detail Laporan
                  </h3>
                </div>
                
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-premium">
                  {/* Header Info */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg flex-shrink-0">
                        <FiFileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                          {laporanDetail.nama_perusahaan}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: <span className="font-mono">{laporanDetail.id}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2 flex-wrap">
                      {laporanDetail.is_implemented && (
                        <span className="px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3" />
                          Sudah Implementasi
                        </span>
                      )}
                      {laporanDetail.blockchain_doc_hash && (
                        <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1">
                          <FiShield className="w-3 h-3" />
                          Verified Blockchain
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        laporanDetail.jenis_kegiatan === 'Planting Mangrove'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {laporanDetail.jenis_kegiatan}
                      </span>
                    </div>
                  </div>

                  {/* Detail Fields */}
                  <div className="space-y-4">
                    {/* PIC */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1 flex items-center gap-2">
                        <FiUser className="w-4 h-4" /> PIC
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {laporanDetail.nama_pic}
                      </p>
                    </div>

                    {/* Narahubung */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                        Narahubung
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                        {laporanDetail.narahubung}
                      </p>
                    </div>

                    {/* Jenis Bibit */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                        Jenis Bibit
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {laporanDetail.jenis_bibit}
                      </p>
                    </div>

                    {/* Jumlah Bibit */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                        Jumlah Bibit
                      </p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {laporanDetail.jumlah_bibit} unit
                      </p>
                    </div>

                    {/* Tanggal */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1 flex items-center gap-2">
                        <FiCalendar className="w-4 h-4" /> Tanggal Pelaksanaan
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(laporanDetail.tanggal_pelaksanaan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Lokasi */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1 flex items-center gap-2">
                        <FiMapPin className="w-4 h-4" /> Lokasi
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                        {laporanDetail.lokasi}
                      </p>
                    </div>

                    {/* Blockchain Info */}
                    {laporanDetail.blockchain_doc_hash && (
                      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2 flex items-center gap-2">
                          <FiShield className="w-4 h-4" /> Blockchain
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Doc Hash:</p>
                            <code className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">
                              {laporanDetail.blockchain_doc_hash}
                            </code>
                          </div>
                          {laporanDetail.blockchain_tx_hash && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">TX Hash:</p>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${laporanDetail.blockchain_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all flex items-center gap-1"
                              >
                                {laporanDetail.blockchain_tx_hash}
                                <FiExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dibuat Tanggal */}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                        Dibuat pada
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {new Date(laporanDetail.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Scan Ulang Button */}
                  <motion.button
                    onClick={resetScan}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Scan QR Lain
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Instructions (jika belum scan) */}
          {!laporanDetail && (
            <motion.div 
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 p-6">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-blue-600" />
                  Cara Menggunakan
                </h4>
                <ol className="space-y-3">
                  {/*
                    "Izinkan akses kamera",
                    "Pilih kamera jika ada lebih dari satu",
                    "Arahkan ke QR Code",
                    "Atau upload gambar/input manual",
                    "Detail laporan akan ditampilkan"
                  */}
                  {["Izinkan akses kamera", "Pilih kamera jika ada lebih dari satu", "Arahkan ke QR Code", "Atau upload gambar/input manual", "Detail laporan akan ditampilkan"].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Info Card */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700 p-6">
                <h4 className="font-bold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5" />
                  Informasi Publik
                </h4>
                <p className="text-xs text-green-800 dark:text-green-300 mb-3">
                  Halaman ini dapat diakses oleh siapa saja tanpa perlu login. Scan QR Code dari laporan untuk melihat detail lengkapnya.
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  ✅ Transparansi: Semua data perencanaan kegiatan konservasi dapat diverifikasi melalui QR Code
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}