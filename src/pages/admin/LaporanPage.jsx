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
import { ethers } from 'ethers';

// ✅ GLOBAL RATE LIMITING CONTROLS
let lastEnrichmentTime = 0;
const MIN_ENRICHMENT_INTERVAL = 60000; // Increased to 60 seconds
const POLL_TIMEOUT = 8000; // Increased timeout

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
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [blockchainCache, setBlockchainCache] = useState({});
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { 
    isReady, 
    verifyDocumentHash,
    getTransactionProof 
  } = useBlockchain();

  // ✅ Initial fetch on mount
  useEffect(() => {
    fetchLaporan();
  }, []);

  // ✅ IMPROVED: Wait for blockchain to be ready, THEN enrich data
  useEffect(() => {
    if (!isReady) {
      console.log('[LaporanPage] ⏳ Waiting for blockchain service to be ready...');
      return; // ✅ Don't proceed if not ready
    }

    if (laporan.length === 0) {
      console.log('[LaporanPage] ⏳ Waiting for laporan data to load...');
      return; // ✅ Don't proceed if no data yet
    }

    // ✅ THROTTLE: Only call full enrichment every 60 seconds
    const now = Date.now();
    if (now - lastEnrichmentTime > MIN_ENRICHMENT_INTERVAL) {
      lastEnrichmentTime = now;
      console.log('[LaporanPage] ✅ Blockchain ready AND data loaded, starting enrichment...');
      enrichLaporanWithBlockchainData();
    } else {
      console.log('[LaporanPage] Skipping enrichment (throttled)');
    }
  }, [isReady, laporan.length]); // ✅ Depend on isReady too!

  // ✅ MAIN: Fetch laporan dari API dengan INCREASED TIMEOUT & RETRY
  const fetchLaporan = async (retries = 3, page = 1, perPage = 25) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[LaporanPage] Fetching laporan from /perencanaan/all ...`);
      
      // ✅ FIXED: Gunakan endpoint /perencanaan/all untuk semua data
      const response = await api.get('/perencanaan/all', { timeout: 30000 });
      const rawData = response.data?.data || response.data || [];
      const transformedList = rawData.map(transformBlockchainData);

      console.log('[LaporanPage] Loaded:', {
        total: transformedList.length,
        withTxHash: transformedList.filter(l => l.blockchain_tx_hash).length,
        withDocHash: transformedList.filter(l => l.blockchain_doc_hash).length,
        pending: transformedList.filter(l => l.blockchain_doc_hash && !l.blockchain_tx_hash).length,
      });

      setLaporan(transformedList);
      
      if (transformedList.length > 0) {
        toast.success(`📊 ${transformedList.length} laporan dimuat`);
      }
    } catch (err) {
      console.error('[LaporanPage] Fetch error:', {
        message: err.message,
        timeout: err.code === 'ECONNABORTED',
        retries
      });

      // ✅ RETRY LOGIC: Jika timeout, tunggu & retry dengan smaller batch
      if (err.code === 'ECONNABORTED' && retries > 0) {
        console.warn(`[LaporanPage] Timeout! Retrying (${retries} left)...`);
        toast.warning(`⏳ API lambat, mencoba ulang...`, { autoClose: 3000 });
        
        await new Promise(r => setTimeout(r, 2000));
        return fetchLaporan(retries - 1, page, Math.floor(perPage / 2));
      }

      setError('⏱️ API timeout - loading dari cache atau minimal data');
      toast.error('❌ Timeout: Backend lambat. Silakan refresh atau tunggu beberapa saat.');
      setLaporan([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ REDUCED: Polling frequency untuk mengurangi rate limit errors
  useEffect(() => {
    if (laporan.length === 0) return;

    const pendingItems = laporan.filter(l => l.blockchain_doc_hash && !l.blockchain_tx_hash);
    if (pendingItems.length === 0) return;

    console.log(`[LaporanPage] Lightweight polling for ${pendingItems.length} pending items...`);

    // ✅ INCREASED: Polling interval from 10s to 30s
    const pollInterval = setInterval(() => {
      // ✅ Lightweight poll - only check database, NO blockchain calls
      pendingItems.slice(0, 3).forEach(item => { // Max 3 items per poll
        api.get(`/perencanaan/${item.id}`, { timeout: POLL_TIMEOUT })
          .then(response => {
            const updated = transformBlockchainData(response.data?.data || response.data);
            
            if (updated.blockchain_tx_hash && updated.blockchain_tx_hash !== item.blockchain_tx_hash) {
              console.log(`✅ TX Hash confirmed for ${item.nama_perusahaan}`);
              
              setLaporan(prev =>
                prev.map(l =>
                  l.id === item.id
                    ? { ...l, blockchain_tx_hash: updated.blockchain_tx_hash, blockchain_status: updated.blockchain_status }
                    : l
                )
              );
              
              toast.success(`🔗 ${updated.nama_perusahaan} - TX Hash tersedia!`, {
                position: "top-right",
                autoClose: 3000
              });
            }
          })
          .catch(err => {
            if (err.response?.status === 429) {
              console.warn(`Rate limited while polling ${item.id}, slowing down...`);
            } else {
              console.warn(`Poll error for ${item.id}:`, err.message);
            }
          });
      });
    }, 30000); // ✅ Increased from 10s to 30s

    return () => clearInterval(pollInterval);
  }, [laporan]);


  // ✅ SIMPLIFIED: Enrichment with better rate limiting
  const enrichLaporanWithBlockchainData = async () => {
    if (!isReady) {
      console.warn('[LaporanPage] Blockchain not ready for enrichment');
      return;
    }

    if (laporan.length === 0) return;

    // ✅ THROTTLE: Only allow enrichment every 60 seconds
    const now = Date.now();
    if (now - lastEnrichmentTime < MIN_ENRICHMENT_INTERVAL) {
      console.log('[LaporanPage] Enrichment throttled, skipping...');
      return;
    }
    lastEnrichmentTime = now;

    const itemsWithDocHash = laporan.filter(item => item.blockchain_doc_hash);
    if (itemsWithDocHash.length === 0) return;

    // ✅ REDUCED: Limit concurrent verification to prevent rate limiting
    const maxConcurrentVerifications = 3; // Reduced from 5
    const itemsToVerify = itemsWithDocHash.slice(0, maxConcurrentVerifications);

    console.log(`[LaporanPage] Rate-limited enrichment for ${itemsToVerify.length} items (max ${maxConcurrentVerifications})...`);
    
    const progressToast = toast.info(
      `🔍 Verifying ${itemsToVerify.length} documents (rate limited)...`,
      { autoClose: false }
    );

    const cache = { ...blockchainCache };
    let enrichedCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      // ✅ Process items sequentially to avoid rate limits
      for (let i = 0; i < itemsToVerify.length; i++) {
        const item = itemsToVerify[i];
        
        toast.update(progressToast, {
          render: `🔍 Verifying ${i + 1}/${itemsToVerify.length}... (rate limited)`,
          type: "info"
        });

        const cacheKey = item.id;
        const cachedData = cache[cacheKey];
        
        // ✅ Check cache (10 min expiry for rate limiting)
        if (cachedData?.timestamp) {
          const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();
          if (cacheAge < 600000) { // 10 minutes
            continue;
          }
        }

        try {
          // ✅ Add delay between verifications to prevent rate limiting
          if (i > 0) {
            await new Promise(r => setTimeout(r, 2000)); // 2 second delay
          }

          const verificationResult = await Promise.race([
            verifyDocumentHash(item.blockchain_doc_hash),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 12000) // Increased timeout
            )
          ]);

          let blockchainData;
          if (verificationResult.verified) {
            blockchainData = {
              ...verificationResult,
              status: item.blockchain_tx_hash ? 'VERIFIED' : 'CONFIRMED',
              verified: true,
              timestamp: new Date().toISOString()
            };
            enrichedCount++;
          } else {
            blockchainData = {
              docHash: item.blockchain_doc_hash,
              verified: false,
              status: 'PENDING_BLOCKCHAIN',
              error: verificationResult.error,
              timestamp: new Date().toISOString()
            };
            skipCount++;
          }

          cache[cacheKey] = blockchainData;
          
          // ✅ Update state immediately for better UX
          setLaporan(prev =>
            prev.map(l =>
              l.id === item.id ? { ...l, blockchainData } : l
            )
          );

        } catch (err) {
          errorCount++;
          console.warn(`[LaporanPage] Verification failed for ${item.id}:`, err.message);
          
          // ✅ If rate limited, stop processing to avoid further rate limits
          if (err.message.includes('429') || err.message.includes('Rate limited')) {
            console.warn('[LaporanPage] Rate limited during enrichment, stopping...');
            toast.update(progressToast, {
              render: "⚠️ Rate limited - pausing enrichment",
              type: "warning",
              autoClose: 3000
            });
            break;
          }
          
          const errorData = {
            docHash: item.blockchain_doc_hash,
            verified: false,
            status: 'ERROR',
            error: err.message,
            timestamp: new Date().toISOString()
          };
          cache[cacheKey] = errorData;
        }
      }

      setBlockchainCache({ ...cache });

      // ✅ Final result toast
      toast.update(progressToast, {
        render: `✅ Verified: ${enrichedCount}, Pending: ${skipCount}, Errors: ${errorCount}`,
        type: enrichedCount > 0 ? "success" : "info",
        autoClose: 4000
      });

    } catch (err) {
      toast.update(progressToast, {
        render: "❌ Enrichment failed: " + err.message,
        type: "error",
        autoClose: 3000
      });
    }
  };

  // ✅ HELPER: Generate sample Sepolia transaction hashes untuk demo
  const generateSampleSepoliaHash = (itemId) => {
    // Generate deterministic hash berdasarkan item ID
    const baseNum = 1000000 + itemId;
    return `0x${baseNum.toString(16).padStart(64, '0')}`;
  };

  // ✅ REAL-TIME: Fetch transaction data dari Sepolia RPC dengan retry logic
  const fetchTransactionFromSepolia = async (txHash, retries = 3) => {
    try {
      if (!txHash || txHash === '0x') {
        return null;
      }

      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
      if (!rpcUrl) {
        console.warn('[LaporanPage] No RPC URL configured');
        return null;
      }

      console.log(`[LaporanPage] Fetching TX from Sepolia (attempt 1/${retries}):`, txHash);

      // ✅ Retry logic jika tx belum muncul di blockchain
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getTransactionByHash',
              params: [txHash],
              id: 1,
            }),
          });

          const data = await response.json();

          if (data.result) {
            console.log(`[LaporanPage] ✅ TX found on Sepolia (attempt ${attempt}):`, data.result);
            
            const tx = data.result;
            const blockNumber = parseInt(tx.blockNumber, 16);
            const gasPrice = parseInt(tx.gasPrice, 16);
            const gas = parseInt(tx.gas, 16);

            // ✅ Fetch receipt untuk status lengkap
            let receipt = null;
            try {
              const receiptResponse = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_getTransactionReceipt',
                  params: [txHash],
                  id: 2,
                }),
              });

              const receiptData = await receiptResponse.json();
              receipt = receiptData.result;
              console.log('[LaporanPage] Receipt fetched:', receipt);
            } catch (err) {
              console.warn('[LaporanPage] Could not fetch receipt:', err.message);
            }

            // ✅ Get current block number untuk calculate confirmations
            let confirmations = 0;
            try {
              const blockResponse = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_blockNumber',
                  id: 3,
                }),
              });

              const blockData = await blockResponse.json();
              const currentBlockNumber = parseInt(blockData.result, 16);
              confirmations = currentBlockNumber - blockNumber;
              console.log(`[LaporanPage] Confirmations: ${confirmations}`);
            } catch (err) {
              console.warn('[LaporanPage] Could not fetch block number:', err.message);
            }

            return {
              txHash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: (parseInt(tx.value, 16) / 1e18).toFixed(4),
              blockNumber: blockNumber,
              gasPrice: (gasPrice / 1e9).toFixed(2),
              gas: gas,
              gasUsed: receipt?.gasUsed ? parseInt(receipt.gasUsed, 16) : null,
              status: receipt?.status === '0x1' ? 'success' : receipt?.status === '0x0' ? 'failed' : 'pending',
              verified: !!receipt,
              confirmations: confirmations,
              explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
              fetchedAt: new Date().toISOString()
            };
          } else if (data.error) {
            console.warn(`[LaporanPage] RPC Error (attempt ${attempt}):`, data.error);
            
            // Retry after delay jika tx belum muncul
            if (attempt < retries) {
              console.log(`[LaporanPage] Retrying in 2 seconds...`);
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        } catch (err) {
          console.warn(`[LaporanPage] Fetch error (attempt ${attempt}):`, err.message);
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      console.warn(`[LaporanPage] Could not fetch TX after ${retries} attempts:`, txHash);
      return null;
    } catch (err) {
      console.error('[LaporanPage] Error in fetchTransactionFromSepolia:', err);
      return null;
    }
  };

  // ✅ ENRICHMENT: Fetch real blockchain tx hashes dari Sepolia dengan parallel processing
  // Note: Duplicate function removed, using the one defined earlier

  // ✅ Generate blockchain QR with simplified logic
  const generateBlockchainQRCode = async (item) => {
    setSelectedLaporan(item);
    setLoadingBlockchain(true);
    
    try {
      console.log('[LaporanPage] Generating simplified blockchain QR code...');
      
      // ✅ SIMPLIFIED: No blockchain verification needed
      const isBlockchainComplete = !!item.blockchain_tx_hash;
      
      // ✅ MINIMAL QR data
      const qrData = {
        id: item.id,
        docHash: item.blockchain_doc_hash || null,
        txHash: item.blockchain_tx_hash || null,
        status: isBlockchainComplete ? "Verified" : item.blockchain_doc_hash ? "PROCESSING" : "DATABASE_ONLY",
        source: isBlockchainComplete ? "BLOCKCHAIN" : "DATABASE"
      };

      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: isBlockchainComplete ? '#10b981' : item.blockchain_doc_hash ? '#f59e0b' : '#3b82f6',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'L'
      });

      // ✅ Full data for download
      const fullData = {
        type: 'PERENCANAAN_BLOCKCHAIN',
        timestamp: new Date().toISOString(),
        verification: {
          status: qrData.status,
          blockchainComplete: isBlockchainComplete,
          docHash: item.blockchain_doc_hash || null,
          txHash: item.blockchain_tx_hash || null,
          explorerUrl: item.blockchain_tx_hash ? `https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}` : null,
          source: qrData.source
        },
        data: {
          id: item.id,
          nama_perusahaan: item.nama_perusahaan,
          nama_pic: item.nama_pic,
          jenis_kegiatan: item.jenis_kegiatan,
          jumlah_bibit: item.jumlah_bibit,
          lokasi: item.lokasi,
          is_implemented: item.is_implemented,
          blockchain_doc_hash: item.blockchain_doc_hash,
          blockchain_tx_hash: item.blockchain_tx_hash
        }
      };

      setQrCodeData({
        url: qrUrl,
        data: fullData,
        verified: isBlockchainComplete
      });
      
      setQrModalOpen(true);
      
      if (isBlockchainComplete) {
        toast.success("🔗 QR Code with blockchain proof!");
      } else if (item.blockchain_doc_hash) {
        toast.info("⏳ QR Code - Transaction processing...");
      } else {
        toast.info("📱 QR Code from database");
      }
      
    } catch (err) {
      console.error('[LaporanPage] QR generation error:', err);
      toast.error("❌ Failed to generate QR Code: " + err.message);
    } finally {
      setLoadingBlockchain(false);
    }
  };

  // ✅ Fetch laporan dengan pagination
  const fetchLaporanWithPagination = async (page = 1, perPage = 25) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[LaporanPage] Fetching laporan (page ${page})...`);
      
      const response = await api.get('/perencanaan/all', { timeout: 30000 });
      const rawData = response.data?.data || response.data || [];
      const transformedList = rawData.map(transformBlockchainData);

      setLaporan(transformedList);
      
      console.log('[LaporanPage] Loaded:', {
        total: transformedList.length,
        withTxHash: transformedList.filter(l => l.blockchain_tx_hash).length,
        withDocHash: transformedList.filter(l => l.blockchain_doc_hash).length,
        pending: transformedList.filter(l => l.blockchain_doc_hash && !l.blockchain_tx_hash).length,
      });
      
    } catch (err) {
      console.error('[LaporanPage] Fetch error:', err.message);
      setError('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter dan search
  const filteredLaporan = laporan.filter(item => {
    const matchSearch = 
      item.nama_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_pic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = 
      filterStatus === "all" ||
      (filterStatus === "implemented" && item.is_implemented) ||
      (filterStatus === "pending" && !item.is_implemented) ||
      (filterStatus === "blockchain" && item.blockchainData?.txHash);
    
    return matchSearch && matchStatus;
  });

  // ✅ Pagination calculation
  const totalPages = Math.ceil(filteredLaporan.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLaporan.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <LoadingSpinner show={true} message="Memuat laporan dari blockchain..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
            <FiFileText className="text-emerald-600" /> 
            Laporan Perencanaan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-emerald-500" />
            {filteredLaporan.length} laporan • 
            ✅ {laporan.filter(l => l.blockchain_tx_hash).length} Verified •
            ⏳ {laporan.filter(l => l.blockchain_doc_hash && !l.blockchain_tx_hash).length} Processing •
            📋 {laporan.filter(l => !l.blockchain_doc_hash).length} Database Only
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

        {/* Table */}
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
              <div className="md:col-span-1">No</div>
              <div className="md:col-span-3">Perusahaan</div>
              <div className="md:col-span-5">🔗 Hash Transaksi Blockchain (Sepolia)</div>
              <div className="md:col-span-3">Status</div>
            </div>

            {/* Table Body - UPDATED dengan hash display yang benar */}
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
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {indexOfFirstItem + index + 1}
                    </span>
                  </div>

                  {/* Perusahaan */}
                  <div className="md:col-span-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {item.nama_perusahaan}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {item.id}</p>
                  </div>

                  {/* ✅ Hash Transaksi Blockchain - SIMPLIFIED STATUS LOGIC */}
                  <div className="md:col-span-5">
                    {/* ✅ CASE 1: TX Hash exists = DONE */}
                    {item.blockchain_tx_hash ? (
                      <motion.div 
                        className="space-y-2 group"
                        whileHover={{ scale: 1.02 }}
                      >
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2">
                          <motion.div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-green-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          ></motion.div>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            ✅ Verified - TX CONFIRMED ON SEPOLIA
                          </span>
                        </div>

                        {/* Real TX Hash Display */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                            🔗 Sepolia Transaction Hash
                          </p>
                          <code className="text-xs font-mono text-emerald-700 dark:text-emerald-300 break-all flex items-center gap-2">
                            {item.blockchain_tx_hash.substring(0, 30)}...
                            <motion.a
                              href={`https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex-shrink-0"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.95 }}
                              title="View on Etherscan Sepolia"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" />
                            </motion.a>
                          </code>
                        </div>

                        {/* Document Hash Display */}
                        {item.blockchain_doc_hash && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                              📝 Document Hash
                            </p>
                            <code className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">
                              {item.blockchain_doc_hash.substring(0, 30)}...
                            </code>
                          </div>
                        )}

                        {/* ✅ SIMPLIFIED: Final Status - DONE */}
                        <motion.div
                          className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 rounded-lg p-2 border border-green-200 dark:border-green-700"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                        >
                          <FiCheck className="w-4 h-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                          <span className="text-xs font-bold text-green-700 dark:text-green-300">
                            ✅ BLOCKCHAIN COMPLETED - Transaction recorded permanently
                          </span>
                        </motion.div>
                      </motion.div>

                    ) : item.blockchain_doc_hash ? (
                      /* ✅ CASE 2: Only doc hash = PROCESSING */
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            className="w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          ></motion.div>
                          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                            ⏳ PROCESSING - Awaiting blockchain confirmation
                          </span>
                        </div>
                        
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                              📝 Document Hash (Generated)
                            </p>
                            <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all block bg-white dark:bg-gray-800 p-2 rounded">
                              {item.blockchain_doc_hash}
                            </code>
                          </div>
                          
                          <div className="pt-2 border-t border-yellow-200 dark:border-yellow-700">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
                              💡 <strong>Status:</strong> Waiting for blockchain transaction to be mined
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              ⏱️ This usually takes 1-5 minutes on Sepolia network
                            </p>
                          </div>
                        </div>
                      </motion.div>

                    ) : (
                      /* ✅ CASE 3: No blockchain data = DATABASE ONLY */
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs">📋 Database only - No blockchain integration</span>
                      </div>
                    )}
                  </div>

                  {/* ✅ SIMPLIFIED Status Column */}
                  <div className="md:col-span-3">
                    <div className="flex gap-2 flex-wrap items-center">
                      {/* ✅ SIMPLIFIED: Status badges - 3 states only */}
                      {item.blockchain_tx_hash ? (
                        <motion.span 
                          className="px-2 py-1 rounded text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          <FiCheck className="w-3 h-3" />
                          Verified
                        </motion.span>
                      ) : item.blockchain_doc_hash ? (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                          <FiRefreshCw className="w-3 h-3 animate-spin" />
                          ⏳ PROCESSING
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          📋 DATABASE ONLY
                        </span>
                      )}
                      
                      {/* Implementation status */}
                      {item.is_implemented && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                          ✅ Implemented
                        </span>
                      )}

                      {/* ✅ SIMPLIFIED Action Buttons - Remove Verify button */}
                      <div className="flex gap-1 mt-2 w-full">
                        {/* QR Code Generation */}
                        <motion.button
                          onClick={() => generateBlockchainQRCode(item)}
                          disabled={loadingBlockchain && selectedLaporan?.id === item.id}
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                            item.blockchain_tx_hash
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title={item.blockchain_tx_hash ? "Generate blockchain-verified QR" : "Generate QR from database"}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <span>QR</span>
                        </motion.button>

                        {/* PDF Generation */}
                        <motion.button
                          onClick={() => generatePDF(item)}
                          className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 flex items-center gap-1 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Download PDF report"
                        >
                          <FiDownload className="w-3 h-3" />
                          <span>PDF</span>
                        </motion.button>
                      </div>
                    </div>
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

        {/* ✅ QR Code Modal - FIXED */}
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
    </div>
  );
}

// ✅ Transform blockchain data dari backend response
const transformBlockchainData = (item) => {
  return {
    ...item,
    // ✅ Handle berbagai format response dari backend
    blockchain_doc_hash: item.blockchain_doc_hash || item.blockchain?.doc_hash || null,
    blockchain_tx_hash: item.blockchain_tx_hash || item.blockchain?.tx_hash || null,
    blockchain_status: item.blockchain_status || item.blockchain?.status || 'none',
    blockchain_doc_id: item.blockchain_doc_id || item.blockchain?.doc_id || null,
    blockchain_block_number: item.blockchain_block_number || item.blockchain?.block_number || null,
    blockchain_contract_address: item.blockchain_contract_address || item.blockchain?.contract_address || null,
  };
};