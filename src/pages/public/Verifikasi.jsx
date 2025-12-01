// src/pages/public/Verifikasi.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  FiCamera, FiCheckCircle, FiAlertCircle, FiRefreshCw, 
  FiX, FiDownload, FiCopy, FiChevronDown, FiChevronUp, FiUpload
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useBlockchain } from "../../contexts/BlockchainContext";
import api from "../../api/axios";
import "leaflet/dist/leaflet.css";

// ✅ Lazy load Scanner
const Scanner = null;

// ✅ Hapus mock data statis, ganti dengan fungsi fetch dari blockchain
const getMockLaporanDetail = (id) => {
  // ✅ Fallback minimal jika blockchain tidak tersedia
  return {
    id,
    nama_perusahaan: "Data dari Blockchain (Loading...)",
    error: "Silakan tunggu atau cek blockchain connection"
  };
};

// ✅ Fungsi baru untuk fetch dari Sepolia Blockchain
const fetchFromBlockchain = async (docHash, blockchainContext) => {
  try {
    if (!blockchainContext?.contract) {
      console.warn('[Verifikasi] Blockchain contract not available');
      return null;
    }

    console.log('[Verifikasi] Fetching from blockchain:', docHash);
    
    // ✅ Call smart contract function untuk ambil document
    const documentData = await blockchainContext.contract.getDocument(docHash);
    
    console.log('[Verifikasi] Blockchain data received:', documentData);
    
    // ✅ Parse blockchain data
    const parsedData = {
      id: documentData.id?.toNumber?.() || documentData.id,
      nama_perusahaan: documentData.nama_perusahaan,
      nama_pic: documentData.nama_pic,
      narahubung: documentData.narahubung,
      jenis_kegiatan: documentData.jenis_kegiatan,
      jenis_bibit: documentData.jenis_bibit,
      jumlah_bibit: documentData.jumlah_bibit?.toNumber?.() || documentData.jumlah_bibit,
      lokasi: documentData.lokasi,
      tanggal_pelaksanaan: documentData.tanggal_pelaksanaan,
      is_implemented: documentData.is_implemented || true,
      blockchain_doc_hash: docHash,
      blockchain_timestamp: documentData.timestamp?.toNumber?.() || Date.now(),
      blockchain_verified: true,
      source: 'BLOCKCHAIN_SEPOLIA'
    };
    
    return parsedData;
  } catch (err) {
    console.error('[Verifikasi] Error fetching from blockchain:', err);
    return null;
  }
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
  const [blockchainReady, setBlockchainReady] = useState(false);
  const [blockchainError, setBlockchainError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const blockchainContext = useBlockchain();

  const [ScannerComponent, setScannerComponent] = useState(null);
  const [qrDataParsed, setQrDataParsed] = useState(null);

  // ✅ Load Scanner Component
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
          
          if (scannerReady && !useManualInput) {
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

  // ✅ Check blockchain readiness
  useEffect(() => {
    if (blockchainContext?.isReady) {
      setBlockchainReady(true);
      setBlockchainError(null);
      console.log('[Verifikasi] Blockchain is ready');
    } else {
      setBlockchainReady(false);
      console.warn('[Verifikasi] Blockchain not ready yet');
    }
  }, [blockchainContext?.isReady]);

  // ✅ Handle successful scan dari kamera
  const handleScan = (detections) => {
    if (detections?.length > 0) {
      const qrData = detections[0].rawValue;
      console.log('[Verifikasi] QR Code detected:', qrData);
      processQRData(qrData);
    }
  };

  // ✅ Handle scan errors - FIXED
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

  // ✅ Fetch detail laporan dari API
  const fetchLaporanDetail = async (laporanId) => {
    setLoadingLaporan(true);
    try {
      let laporan = null;
      let lastError = null;

      // ✅ 1. PRIORITY: Fetch dari Sepolia Blockchain jika ada doc hash
      if (blockchainReady && qrDataParsed?.blockchain_doc_hash) {
        try {
          console.log('[Verifikasi] Step 1: Trying Sepolia Blockchain...');
          laporan = await blockchainContext.getDocument(qrDataParsed.blockchain_doc_hash);
          
          if (laporan) {
            console.log('[Verifikasi] ✅ Data fetched from Sepolia Blockchain successfully');
            setLaporanDetail(laporan);
            toast.success("🔗 Data berhasil diambil dari Sepolia Blockchain!");
            setLoadingLaporan(false);
            return;
          }
        } catch (blockchainErr) {
          console.warn('[Verifikasi] Sepolia Blockchain fetch failed:', blockchainErr.message);
          lastError = blockchainErr;
        }
      }

      // ✅ 2. Fallback: Try public endpoint
      try {
        console.log(`[Verifikasi] Step 2: Trying public endpoint: /perencanaan/${laporanId}/public`);
        const response = await api.get(`/perencanaan/${laporanId}/public`);
        laporan = response.data?.data || response.data;
        
        if (laporan) {
          console.log('[Verifikasi] ✅ Data fetched from API successfully');
          setLaporanDetail(laporan);
          toast.success("📊 Detail laporan berhasil dimuat dari server!");
          setLoadingLaporan(false);
          return;
        }
      } catch (publicErr) {
        console.warn(`[Verifikasi] Public endpoint failed (${publicErr.response?.status})`);
        lastError = publicErr;
      }

      // ✅ 3. Fallback: Try authenticated endpoint
      if (isAuthenticated) {
        try {
          console.log(`[Verifikasi] Step 3: Trying authenticated endpoint: /perencanaan/${laporanId}`);
          const response = await api.get(`/perencanaan/${laporanId}`);
          laporan = response.data?.data || response.data;
          
          if (laporan) {
            console.log('[Verifikasi] ✅ Data fetched from authenticated endpoint');
            setLaporanDetail(laporan);
            toast.success("📊 Detail laporan berhasil dimuat!");
            setLoadingLaporan(false);
            return;
          }
        } catch (authErr) {
          console.warn(`[Verifikasi] Authenticated endpoint failed (${authErr.response?.status})`);
          lastError = authErr;
        }
      }

      // ✅ 4. Fallback: Use QR code data
      if (parsedData && typeof parsedData === 'object' && parsedData.id) {
        laporan = parsedData;
        console.log('[Verifikasi] Using data from QR code as fallback');
        setLaporanDetail(laporan);
        toast.info("💡 Menampilkan data dari QR Code", { autoClose: 2000 });
        setLoadingLaporan(false);
        return;
      }

      // ✅ 5. Last resort: Mock data
      const mockLaporan = getMockLaporanDetail(laporanId);
      if (mockLaporan) {
        laporan = mockLaporan;
        console.log('[Verifikasi] Using mock data as last resort');
        setLaporanDetail(laporan);
        toast.info("💡 Menampilkan data demo", { autoClose: 2000 });
        setLoadingLaporan(false);
        return;
      }

      throw lastError || new Error('Tidak dapat memuat detail laporan dari semua sumber');

    } catch (err) {
      console.error('[Verifikasi] All fetch attempts failed:', {
        blockchainReady,
        error: err.message,
        parsedDataAvailable: !!parsedData
      });
      
      toast.warning("⚠️ Tidak dapat memuat detail lengkap - menampilkan data QR Code");
      if (parsedData) {
        setLaporanDetail(parsedData);
      } else {
        setLaporanDetail(null);
      }
    } finally {
      setLoadingLaporan(false);
    }
  };

  // ✅ OPTIMIZED: Fast blockchain verification untuk public page
  const verifyBlockchainData = async () => {
    if (!qrDataParsed?.verification?.docHash) {
      toast.warning("⚠️ No blockchain data in QR code");
      return;
    }

    try {
      // ✅ Show instant loading feedback
      toast.info("🔍 Verifying on Sepolia blockchain...", { autoClose: 2000 });
      
      if (blockchainContext?.isReady) {
        // ✅ Fast verification with timeout
        const blockchainVerified = await Promise.race([
          blockchainContext.verifyDocumentHash(qrDataParsed.verification.docHash),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Verification timeout')), 8000)
          )
        ]);
        
        if (blockchainVerified.verified) {
          console.log('[Verifikasi] ✅ Blockchain verification successful');
          
          toast.success("🔗 ✅ Verified on Sepolia blockchain!", { autoClose: 4000 });
          
          // ✅ Update laporan dengan blockchain data
          setLaporanDetail({
            ...laporanDetail,
            ...blockchainVerified.metadata,
            blockchain_verified: true,
            blockchain_doc_id: blockchainVerified.docId,
            blockchain_timestamp: blockchainVerified.timestampISO,
            blockchain_uploader: blockchainVerified.uploader
          });
        } else {
          toast.warning("⚠️ Document not yet on blockchain - showing QR data");
        }
      } else {
        toast.warning("⚠️ Blockchain service not ready - showing QR data");
      }
    } catch (err) {
      console.error('[Verifikasi] Verification failed:', err);
      
      if (err.message.includes('timeout')) {
        toast.error("❌ Verification timeout - blockchain slow, showing QR data");
      } else {
        toast.error("❌ Verification failed: " + err.message);
      }
    }
  };

  // ✅ OPTIMIZED: Process QR dengan instant feedback
  const processQRData = async (qrData) => {
    try {
      const parsed = JSON.parse(qrData);
      
      console.log('[Verifikasi] Processing QR:', parsed.type);
      
      // ✅ Instant feedback
      toast.success("✅ QR Code scanned successfully!");
      
      if (parsed.type === 'PERENCANAAN_BLOCKCHAIN') {
        setQrDataParsed(parsed);
        setScanResult(qrData);
        setParsedData(parsed.data);
        setScanning(false);
        setError(null);
        
        // ✅ Set laporan detail immediately from QR (no waiting)
        if (parsed.data) {
          setLaporanDetail(parsed.data);
          toast.info("📊 Showing data from QR code", { autoClose: 2000 });
        }
        
        // ✅ THEN verify blockchain in background (non-blocking)
        if (parsed.verification?.docHash && blockchainContext?.isReady) {
          setTimeout(() => {
            verifyBlockchainData();
          }, 500); // Small delay to let UI update first
        }
        
        return;
      }
      
      // ✅ Handle other QR formats...
      // ...existing code for other formats...
      
    } catch (parseError) {
      // ✅ Handle non-JSON QR codes
      if (/^\d+$/.test(qrData.trim())) {
        const numericId = parseInt(qrData.trim());
        setScanResult(qrData);
        setParsedData({ id: numericId, type: 'NUMERIC_ID' });
        setScanning(false);
        setError(null);
        
        toast.success("✅ ID detected, loading data...");
        await fetchLaporanDetail(numericId);
      } else if (qrData.trim().startsWith('0x') && qrData.trim().length === 66) {
        // Blockchain hash detected
        toast.info("🔗 Blockchain hash detected, verifying...");
        
        if (blockchainContext?.isReady) {
          try {
            const blockchainData = await blockchainContext.verifyDocumentHash(qrData.trim());
            if (blockchainData.verified) {
              setScanResult(qrData);
              setParsedData({ blockchain_doc_hash: qrData.trim(), type: 'BLOCKCHAIN_HASH' });
              setScanning(false);
              setError(null);
              
              const laporanFromBlockchain = {
                id: blockchainData.docId,
                ...blockchainData.metadata,
                blockchain_verified: true,
                blockchain_doc_hash: blockchainData.docHash,
                source: 'BLOCKCHAIN_DIRECT'
              };
              
              setLaporanDetail(laporanFromBlockchain);
              toast.success("🔗 Data loaded from blockchain!");
              return;
            }
          } catch (err) {
            toast.error("❌ Blockchain verification failed");
          }
        }
      } else {
        // Raw text
        setScanResult(qrData);
        setParsedData({ raw: qrData, type: 'TEXT' });
        setScanning(false);
        setError(null);
        
        toast.info("📋 Text data scanned");
      }
    }
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

  // ✅ Handle file upload dengan jsQR dan fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log('[Verifikasi] Processing file upload:', file.name);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            console.log('[Verifikasi] Image loaded, attempting to decode QR');
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            let qrContent = null;

            // ✅ Approach 1: Try jsQR
            try {
              console.log('[Verifikasi] Attempting jsQR decode...');
              const { default: jsQR } = await import('jsqr');
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (code) {
                qrContent = code.data;
                console.log('[Verifikasi] jsQR decode successful:', qrContent);
              }
            } catch (jsqrErr) {
              console.warn('[Verifikasi] jsQR not available or decode failed:', jsqrErr.message);
            }

            // ✅ Approach 2: Try qr-scanner
            if (!qrContent) {
              try {
                console.log('[Verifikasi] Attempting qr-scanner decode...');
                const { default: QrScanner } = await import('qr-scanner');
                const code = await QrScanner.scanImage(img);
                if (code) {
                  qrContent = code;
                  console.log('[Verifikasi] qr-scanner decode successful:', qrContent);
                }
              } catch (qrScannerErr) {
                console.warn('[Verifikasi] qr-scanner not available or decode failed:', qrScannerErr.message);
              }
            }

            // ✅ Approach 3: Fallback dengan ZXing
            if (!qrContent) {
              try {
                console.log('[Verifikasi] Attempting ZXing decode...');
                const { BrowserMultiFormatReader } = await import('@zxing/library');
                const reader = new BrowserMultiFormatReader();
                const result = await reader.decodeFromImageElement(img);
                if (result) {
                  qrContent = result.getText();
                  console.log('[Verifikasi] ZXing decode successful:', qrContent);
                }
              } catch (zxingErr) {
                console.warn('[Verifikasi] ZXing not available or decode failed:', zxingErr.message);
              }
            }

            // ✅ Fallback: Ask user untuk input manual
            if (!qrContent) {
              console.log('[Verifikasi] All QR decoders failed, falling back to manual input');
              toast.warning('⚠️ Tidak dapat membaca QR dari gambar otomatis.');
              toast.info('💡 Silakan input QR code secara manual atau copy-paste data-nya');
              setUseManualInput(true);
            } else {
              processQRData(qrContent);
            }
            
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

  const containerClass = isAuthenticated 
    ? "" 
    : "min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-12 px-3 sm:px-6 lg:px-8 transition-colors";

  const innerContainerClass = isAuthenticated 
    ? "" 
    : "max-w-7xl mx-auto";

  return (
    <div className={containerClass}>
      <div className={innerContainerClass}>
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

            {/* Success State */}
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
                    <FiCheckCircle className="w-5 h-5" />
                    Detail Laporan
                  </h3>
                </div>
                
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-premium">
                  {/* Header Info */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg flex-shrink-0">
                        <FiCheckCircle className="w-6 h-6" />
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
                          🔗 Verified Blockchain
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {laporanDetail.jenis_kegiatan}
                      </span>
                    </div>
                  </div>

                  {/* Detail Fields */}
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Nama PIC</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {laporanDetail.nama_pic}
                      </p>
                    </div>

                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Narahubung</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {laporanDetail.narahubung}
                      </p>
                    </div>

                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Jenis Bibit</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {laporanDetail.jenis_bibit}
                      </p>
                    </div>

                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Jumlah Bibit</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {laporanDetail.jumlah_bibit} unit
                      </p>
                    </div>

                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Tanggal Pelaksanaan</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(laporanDetail.tanggal_pelaksanaan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Lokasi</p>
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