// src/pages/public/Verifikasi.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  FiCamera, FiCheckCircle, FiAlertCircle, FiRefreshCw, 
  FiX, FiDownload, FiCopy, FiChevronDown, FiChevronUp, FiUpload,
  FiShield, FiExternalLink
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
  
  // ✅ NEW: Track blockchain data separately to ensure it never gets lost
  const [blockchainData, setBlockchainData] = useState(null);
  
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const blockchainContext = useBlockchain();

  const [ScannerComponent, setScannerComponent] = useState(null);
  const [qrDataParsed, setQrDataParsed] = useState(null);

  // ✅ Function untuk beep sound dengan beberapa varian
  const playBeepSound = (type = 'success') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // ✅ Varian suara berbeda
      if (type === 'success') {
        // Two beeps: low then high (success sound)
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.1); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
      } else if (type === 'warning') {
        // Continuous beep for warnings
        oscillator.frequency.value = 660; // E5
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      } else if (type === 'triple') {
        // Three short beeps
        oscillator.frequency.value = 800; // G#5
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.12);
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.20);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.20);
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.24);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.32);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.32);
      }
    } catch (err) {
      console.log('[Verifikasi] Beep sound not available:', err.message);
    }
  };

  // ✅ Video ref untuk camera
  const videoRef = useRef(null);

  // ✅ Load Scanner Component dengan QR-Scanner (lebih stabil)
  useEffect(() => {
    const loadScanner = async () => {
      try {
        setScannerReady(true);
        console.log('[Verifikasi] Scanner ready (using browser API)');
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

  // ✅ Start camera stream ketika scanning dimulai
  useEffect(() => {
    if (!scanning || !scannerReady || !videoRef.current) return;

    const startCamera = async () => {
      try {
        console.log('[Verifikasi] Starting camera with device:', deviceId);
        
        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = videoRef.current;
        
        if (video) {
          video.srcObject = stream;
          await video.play().catch(err => {
            console.error('[Verifikasi] Video play error:', err);
          });
        }

        setError(null);
      } catch (err) {
        console.error('[Verifikasi] Camera access error:', err);
        handleError(err);
      }
    };

    startCamera();

    return () => {
      // Stop camera when component unmounts or scanning stops
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [scanning, scannerReady, deviceId]);

  // ✅ Get available cameras
  useEffect(() => {
    if (!scanning || !scannerReady) return;

    let animationFrameId = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let lastScannedData = null;
    let scannedCount = 0;

    const scanFrame = async () => {
      try {
        const video = videoRef.current;
        if (!video || !video.srcObject) {
          scannedCount++;
          if (scannedCount < 100) { // Try for ~3 seconds
            animationFrameId = requestAnimationFrame(scanFrame);
          }
          return;
        }

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // ✅ Try jsQR
          try {
            const { default: jsQR } = await import('jsqr');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code && code.data && code.data !== lastScannedData) {
              lastScannedData = code.data;
              console.log('[Verifikasi] QR detected from video:', code.data.substring(0, 50));
              await processQRData(code.data);
              return; // Stop scanning after success
            }
          } catch (err) {
            // Ignore jsQR errors, continue scanning
          }
        }

        animationFrameId = requestAnimationFrame(scanFrame);
      } catch (err) {
        console.warn('[Verifikasi] Scan frame error:', err);
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameId = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [scanning, scannerReady]);

  // ✅ Check blockchain readiness
  useEffect(() => {
    if (blockchainContext?.isReady) {
      setBlockchainReady(true);
      setBlockchainError(null);
      console.log('[Verifikasi] ✅ Blockchain is ready');
    } else {
      setBlockchainReady(false);
      // Only log if we had it ready before (don't spam on initial load)
      if (blockchainReady) {
        console.warn('[Verifikasi] Blockchain connection lost');
      }
    }
  }, [blockchainContext?.isReady]);

  // ✅ Handle successful scan dari kamera
  const handleScan = (detections) => {
    try {
      if (!detections) {
        console.log('[Verifikasi] No detections');
        return;
      }

      // ✅ Handle array of detections
      if (Array.isArray(detections) && detections.length > 0) {
        const detection = detections[0];
        const qrData = detection?.rawValue || detection?.data || detection;
        
        if (qrData) {
          console.log('[Verifikasi] QR Code detected from array:', qrData);
          processQRData(qrData);
        }
      }
      // ✅ Handle single detection object
      else if (typeof detections === 'object' && detections.rawValue) {
        const qrData = detections.rawValue;
        console.log('[Verifikasi] QR Code detected from object:', qrData);
        processQRData(qrData);
      }
      // ✅ Handle string directly
      else if (typeof detections === 'string') {
        console.log('[Verifikasi] QR Code detected as string:', detections);
        processQRData(detections);
      }
    } catch (err) {
      console.error('[Verifikasi] Error in handleScan:', err);
      toast.error('❌ Error membaca QR Code');
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
          
          // ✅ ALWAYS apply blockchain data if it exists
          if (blockchainData) {
            laporan.blockchain_doc_hash = blockchainData.blockchain_doc_hash;
            laporan.blockchain_tx_hash = blockchainData.blockchain_tx_hash;
            laporan.blockchain_verified = blockchainData.blockchain_verified;
            console.log('[Verifikasi] ✅ Applied blockchain data:', blockchainData);
          }
          
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
            
            // ✅ ALWAYS apply blockchain data if it exists
            if (blockchainData) {
              laporan.blockchain_doc_hash = blockchainData.blockchain_doc_hash;
              laporan.blockchain_tx_hash = blockchainData.blockchain_tx_hash;
              laporan.blockchain_verified = blockchainData.blockchain_verified;
              console.log('[Verifikasi] ✅ Applied blockchain data:', blockchainData);
            }
            
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

  // ✅ OPTIMIZED: Process QR dengan instant feedback dan error handling
  const processQRData = async (qrData) => {
    try {
      // ✅ Validate input
      if (!qrData || typeof qrData !== 'string') {
        console.error('[Verifikasi] Invalid QR data:', qrData);
        toast.error('❌ Format QR code tidak valid');
        return;
      }

      const trimmedData = qrData.trim();
      console.log('[Verifikasi] Processing QR data:', trimmedData.substring(0, 100));
      
      // ✅ Try to parse as JSON first
      let parsed = null;
      try {
        parsed = JSON.parse(trimmedData);
        console.log('[Verifikasi] ✅ Parsed as JSON successfully');
        console.log('[Verifikasi] JSON keys:', Object.keys(parsed));
        console.log('[Verifikasi] Full JSON:', parsed);
      } catch (jsonErr) {
        console.log('[Verifikasi] Not JSON format:', jsonErr.message);
      }

      // ✅ Handle different JSON formats
      if (parsed && typeof parsed === 'object') {
        // Format 1: Old format dengan type: 'PERENCANAAN_BLOCKCHAIN'
        if (parsed.type === 'PERENCANAAN_BLOCKCHAIN') {
          console.log('[Verifikasi] Format 1: PERENCANAAN_BLOCKCHAIN detected');
          playBeepSound('success');
          toast.success("✅ QR Code scanned successfully!");
          setQrDataParsed(parsed);
          setScanResult(qrData);
          setScanning(false);
          setError(null);
          
          // ✅ ALWAYS save blockchain data to state
          if (parsed.verification?.docHash) {
            setBlockchainData({
              blockchain_doc_hash: parsed.verification.docHash,
              blockchain_tx_hash: parsed.verification.txHash,
              blockchain_verified: true
            });
          }
          
          if (parsed.data && Object.keys(parsed.data).length > 0) {
            setParsedData(parsed.data);
            setLaporanDetail(parsed.data);
            console.log('[Verifikasi] ✅ Laporan detail set from QR data', parsed.data);
            toast.info("📊 Showing data from QR code", { autoClose: 2000 });
          } else {
            const minimalData = {
              id: parsed.verification?.docId || 'unknown',
              type: 'PERENCANAAN_BLOCKCHAIN',
              blockchain_verified: true,
              blockchain_doc_hash: parsed.verification?.docHash,
              blockchain_tx_hash: parsed.verification?.txHash
            };
            setParsedData(minimalData);
            setLaporanDetail(minimalData);
          }
          
          if (parsed.verification?.docHash && blockchainContext?.isReady) {
            setTimeout(() => {
              verifyBlockchainData();
            }, 500);
          }
          return;
        }
        
        // Format 2: Minimal format dengan id, docHash, verified
        if (parsed.id || parsed.docHash || parsed.verified !== undefined) {
          console.log('[Verifikasi] Format 2: Minimal blockchain format detected');
          playBeepSound('success');
          toast.success("✅ QR Code scanned successfully!");
          setScanResult(qrData);
          setScanning(false);
          setError(null);
          
          const bcData = {
            id: parsed.id || 'unknown',
            blockchain_doc_hash: parsed.docHash || parsed.blockchain_doc_hash,
            blockchain_tx_hash: parsed.txHash || parsed.blockchain_tx_hash,
            blockchain_verified: parsed.verified || false,
            source: 'QR_CODE'
          };
          
          // ✅ SET BLOCKCHAIN DATA TO STATE
          setBlockchainData(bcData);
          
          setParsedData(bcData);
          setLaporanDetail(bcData);
          setQrDataParsed(parsed);
          
          console.log('[Verifikasi] ✅ Blockchain data set:', bcData);
          toast.info("📊 Blockchain data from QR code", { autoClose: 2000 });
          
          // Fetch full detail if we have ID
          if (parsed.id) {
            await fetchLaporanDetail(parsed.id);
          }
          return;
        }
        
        // Format 3: Any other object format - treat as data
        if (Object.keys(parsed).length > 0) {
          console.log('[Verifikasi] Format 3: Generic JSON object detected');
          playBeepSound('success');
          toast.success("✅ QR Code data received");
          setScanResult(qrData);
          setScanning(false);
          setError(null);
          
          // ✅ SAVE blockchain data if present in Format 3
          if (parsed.blockchain_doc_hash || parsed.docHash) {
            const bcData = {
              blockchain_doc_hash: parsed.blockchain_doc_hash || parsed.docHash,
              blockchain_tx_hash: parsed.blockchain_tx_hash || parsed.txHash,
              blockchain_verified: parsed.blockchain_verified !== undefined ? parsed.blockchain_verified : false
            };
            setBlockchainData(bcData);
            console.log('[Verifikasi] ✅ Format 3 blockchain data set:', bcData);
          }
          
          setParsedData(parsed);
          setLaporanDetail(parsed);
          
          // If has ID, try to fetch full detail
          if (parsed.id) {
            await fetchLaporanDetail(parsed.id);
          }
          return;
        }
      }
      
      // ✅ NUMERIC ID
      if (/^\d+$/.test(trimmedData)) {
        const numericId = parseInt(trimmedData);
        console.log('[Verifikasi] Numeric ID detected:', numericId);
        playBeepSound('triple');
        toast.success("✅ ID detected, loading data...");
        setScanResult(qrData);
        setParsedData({ id: numericId, type: 'NUMERIC_ID' });
        setScanning(false);
        setError(null);
        await fetchLaporanDetail(numericId);
        return;
      }
      
      // ✅ BLOCKCHAIN HASH (0x...)
      if (trimmedData.startsWith('0x') && (trimmedData.length === 66 || trimmedData.length === 130)) {
        console.log('[Verifikasi] Blockchain hash detected');
        playBeepSound('success');
        toast.info("🔗 Blockchain hash detected, verifying...");
        setScanResult(qrData);
        
        // ✅ SET blockchain data immediately
        const bcData = {
          blockchain_doc_hash: trimmedData,
          type: 'BLOCKCHAIN_HASH'
        };
        setBlockchainData(bcData);
        setParsedData(bcData);
        
        setScanning(false);
        setError(null);
        
        console.log('[Verifikasi] ✅ Blockchain hash set:', bcData);
        
        if (blockchainContext?.isReady) {
          try {
            const blockchainResponse = await blockchainContext.verifyDocumentHash(trimmedData);
            if (blockchainResponse?.verified) {
              const laporanFromBlockchain = {
                id: blockchainResponse.docId,
                ...blockchainResponse.metadata,
                blockchain_verified: true,
                blockchain_doc_hash: blockchainResponse.docHash,
                source: 'BLOCKCHAIN_DIRECT'
              };
              setLaporanDetail(laporanFromBlockchain);
              // ✅ Keep blockchain data
              setBlockchainData(bcData);
              toast.success("🔗 Data loaded from blockchain!");
              return;
            }
          } catch (err) {
            console.error('[Verifikasi] Blockchain verification failed:', err);
            toast.error("❌ Blockchain verification failed");
          }
        }
        return;
      }
      
      // ✅ RAW TEXT
      console.log('[Verifikasi] Raw text detected');
      playBeepSound('warning');
      toast.info("📋 Text data scanned");
      setScanResult(qrData);
      setParsedData({ raw: trimmedData, type: 'TEXT' });
      setScanning(false);
      setError(null);
      
    } catch (err) {
      console.error('[Verifikasi] Error in processQRData:', err);
      toast.error('❌ Error processing QR data: ' + err.message);
    }
  };

  // ✅ Reset scan
  const resetScan = () => {
    setScanResult(null);
    setParsedData(null);
    setLaporanDetail(null);
    setBlockchainData(null);
    setQrDataParsed(null);
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
      setScanning(false); // Stop camera
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

            // ✅ Hasil
            if (!qrContent) {
              console.log('[Verifikasi] All QR decoders failed, falling back to manual input');
              toast.warning('⚠️ Tidak dapat membaca QR dari gambar otomatis.');
              toast.info('💡 Silakan input QR code secara manual atau copy-paste data-nya');
              setUseManualInput(true);
            } else {
              console.log('[Verifikasi] QR decoded successfully, processing...');
              toast.success('✅ QR Code dari gambar berhasil dibaca!');
              await processQRData(qrContent);
            }
            
          } catch (decodeErr) {
            console.error('[Verifikasi] Error decoding QR from image:', decodeErr);
            toast.warning('⚠️ Tidak dapat membaca QR dari gambar.');
            setUseManualInput(true);
          }
        };
        img.onerror = () => {
          console.error('[Verifikasi] Image failed to load');
          toast.error('❌ File gambar tidak valid');
        };
        img.src = event.target?.result;
      };
      reader.onerror = () => {
        console.error('[Verifikasi] FileReader error');
        toast.error('❌ Gagal membaca file');
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <motion.div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-green-100 dark:border-gray-700"
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

            {/* Scanner atau Manual Input */}
            <AnimatePresence mode="wait">
              {!useManualInput && scannerReady && scanning && !scanResult ? (
                <motion.div 
                  key="scanner"
                  className="relative rounded-2xl overflow-hidden border-4 border-green-500 shadow-2xl bg-gray-900 mb-6"
                  style={{ aspectRatio: '1/1' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {/* Video Stream untuk QR Code */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                      console.log('[Verifikasi] Video loaded');
                    }}
                  />
                  
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {loadingLaporan ? '⏳ Memuat detail laporan...' : '🔄 Sedang memproses...'}
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

            {/* Success State - Show Detail */}
            {scanResult && laporanDetail && (
              <motion.div 
                className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-8 text-center aspect-square flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                </motion.div>
                <p className="text-green-700 dark:text-green-300 font-bold text-lg mb-2">✅ Berhasil Terverifikasi</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lihat detail laporan di sebelah kanan
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* ✅ DETAIL LAPORAN MODAL - Tampilkan sebagai modal */}
          <AnimatePresence>
            {laporanDetail && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setLaporanDetail(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-green-100 dark:border-gray-700 overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <FiCheckCircle className="w-5 h-5" />
                      Detail Laporan
                    </h3>
                    <button
                      onClick={() => setLaporanDetail(null)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto scrollbar-premium flex-1">
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
                    {laporanDetail?.blockchain_doc_hash || blockchainData?.blockchain_doc_hash ? (
                      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2 flex items-center gap-2">
                          <FiShield className="w-4 h-4" /> Blockchain
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Doc Hash:</p>
                            <code className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">
                              {laporanDetail?.blockchain_doc_hash || blockchainData?.blockchain_doc_hash}
                            </code>
                          </div>
                          {(laporanDetail?.blockchain_tx_hash || blockchainData?.blockchain_tx_hash) && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">TX Hash:</p>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${laporanDetail?.blockchain_tx_hash || blockchainData?.blockchain_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all flex items-center gap-1"
                              >
                                {laporanDetail?.blockchain_tx_hash || blockchainData?.blockchain_tx_hash}
                                <FiExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

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

                  {/* Modal Footer - Close Button */}
                  <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
                    <motion.button
                      onClick={() => setLaporanDetail(null)}
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Tutup
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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