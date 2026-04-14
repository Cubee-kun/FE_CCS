import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useBlockchain } from "../../contexts/BlockchainContext";
import blockchainService from "../../services/blockchain";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { 
  FiFileText, FiCalendar, FiExternalLink, 
  FiCheck, FiX, FiDownload, FiEye, FiAlertCircle,
  FiRefreshCw, FiFilter, FiSearch, FiChevronLeft, FiChevronRight,
  FiMonitor, FiPackage, FiLink, FiHash, FiClock, FiCheckCircle, FiArchive, FiCopy
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { ethers } from 'ethers';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ✅ GLOBAL RATE LIMITING CONTROLS
let lastEnrichmentTime = 0;
const MIN_ENRICHMENT_INTERVAL = 60000; // Increased to 60 seconds
const POLL_TIMEOUT = 8000; // Increased timeout
const SINGLE_TOAST_ID = 'laporan-page-single-toast';

export default function LaporanPage() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [loadingBlockchain, setLoadingBlockchain] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [blockchainCache, setBlockchainCache] = useState({});
  const [reuploadingId, setReuploadingId] = useState(null);
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { 
    isReady, 
    verifyDocumentHash,
    getTransactionProof 
  } = useBlockchain();

  const notifySingle = (type, message, options = {}) => {
    const updatePayload = {
      render: message,
      type,
      isLoading: false,
      ...options,
    };

    if (toast.isActive(SINGLE_TOAST_ID)) {
      toast.update(SINGLE_TOAST_ID, updatePayload);
      return SINGLE_TOAST_ID;
    }

    return toast[type](message, {
      toastId: SINGLE_TOAST_ID,
      ...options,
    });
  };

  const notifySingleLoading = (message) => {
    if (toast.isActive(SINGLE_TOAST_ID)) {
      toast.update(SINGLE_TOAST_ID, {
        render: message,
        type: 'info',
        isLoading: true,
        autoClose: false,
        closeOnClick: false,
      });
      return SINGLE_TOAST_ID;
    }

    return toast.loading(message, {
      toastId: SINGLE_TOAST_ID,
      autoClose: false,
      closeOnClick: false,
    });
  };

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
      console.log('[LaporanPage] ✅ Blockchain ready AND data loaded, starting enrichment...');
      enrichLaporanWithBlockchainData();
    } else {
      console.log('[LaporanPage] Skipping enrichment (throttled)');
    }
  }, [isReady, laporan.length]); // ✅ Depend on isReady too!

  // ✅ AUTO VERIFY: Run enrichment periodically so verification is system-driven
  useEffect(() => {
    if (!isReady || laporan.length === 0) return;

    const intervalId = setInterval(() => {
      enrichLaporanWithBlockchainData();
    }, MIN_ENRICHMENT_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isReady, laporan.length]);

  // ✅ AUTO VERIFY NOW: When tx hash is present, trigger immediate smart-contract verification
  useEffect(() => {
    if (!isReady || laporan.length === 0) return;

    const uploadedPendingVerify = laporan.some(
      item => item.blockchain_tx_hash && item.blockchain_doc_hash && !item.blockchainData?.verified
    );

    if (!uploadedPendingVerify) return;

    enrichLaporanWithBlockchainData({ force: true, onlyUploaded: true });
  }, [isReady, laporan]);

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

      // Preserve items that are already fully verified in UI so refresh does not downgrade status.
      setLaporan((prev) => {
        const prevById = new Map(prev.map((item) => [item.id, item]));

        return transformedList.map((item) => {
          const existing = prevById.get(item.id);
          const keepVerified = existing?.blockchainData?.verified && (item.blockchain_tx_hash || existing.blockchain_tx_hash);

          if (!keepVerified) {
            return item;
          }

          return {
            ...item,
            blockchain_tx_hash: item.blockchain_tx_hash || existing.blockchain_tx_hash,
            blockchainData: {
              ...(existing.blockchainData || {}),
              verified: true,
              status: 'VERIFIED',
              timestamp: existing.blockchainData?.timestamp || new Date().toISOString(),
            },
          };
        });
      });
      
      if (transformedList.length > 0) {
        notifySingle('success', `${transformedList.length} laporan dimuat`);
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
        notifySingle('warning', 'API lambat, mencoba ulang...', { autoClose: 3000 });
        
        await new Promise(r => setTimeout(r, 2000));
        return fetchLaporan(retries - 1, page, Math.floor(perPage / 2));
      }

      setError('⏱️ API timeout - loading dari cache atau minimal data');
      notifySingle('error', 'Timeout: Backend lambat. Silakan refresh atau tunggu beberapa saat.');
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
              
              notifySingle('success', `${updated.nama_perusahaan} - TX Hash tersedia!`, {
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
  const enrichLaporanWithBlockchainData = async (options = {}) => {
    const { force = false, onlyUploaded = false } = options;

    if (!isReady) {
      console.warn('[LaporanPage] Blockchain not ready for enrichment');
      return;
    }

    if (laporan.length === 0) return;

    // ✅ THROTTLE: Only allow enrichment every 60 seconds
    const now = Date.now();
    if (!force && now - lastEnrichmentTime < MIN_ENRICHMENT_INTERVAL) {
      console.log('[LaporanPage] Enrichment throttled, skipping...');
      return;
    }
    lastEnrichmentTime = now;

    let itemsWithDocHash = laporan.filter(
      item => item.blockchain_doc_hash && !item.blockchainData?.verified
    );
    if (onlyUploaded) {
      itemsWithDocHash = itemsWithDocHash.filter(
        item => item.blockchain_tx_hash && !item.blockchainData?.verified
      );
    }

    itemsWithDocHash = itemsWithDocHash.sort(
      (a, b) => Number(!!b.blockchain_tx_hash) - Number(!!a.blockchain_tx_hash)
    );

    if (itemsWithDocHash.length === 0) return;

    const cache = { ...blockchainCache };

    // ✅ REDUCED: Limit concurrent verification to prevent rate limiting
    const maxConcurrentVerifications = 3; // Reduced from 5
    const itemsToVerify = itemsWithDocHash
      .filter((item) => {
        const cachedData = cache[item.id];
        if (!cachedData?.timestamp) return true;

        const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();
        return cacheAge >= 600000; // Reverify only if cache is older than 10 minutes
      })
      .slice(0, maxConcurrentVerifications);

    if (itemsToVerify.length === 0) {
      return;
    }

    console.log(`[LaporanPage] Rate-limited enrichment for ${itemsToVerify.length} items (max ${maxConcurrentVerifications})...`);
    
    notifySingleLoading(`Verifying ${itemsToVerify.length} documents (rate limited)...`);

    let enrichedCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      // ✅ Process items sequentially to avoid rate limits
      for (let i = 0; i < itemsToVerify.length; i++) {
        const item = itemsToVerify[i];
        
        notifySingleLoading(`Verifying ${i + 1}/${itemsToVerify.length}... (rate limited)`);

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
            notifySingle('warning', 'Rate limited - pausing enrichment', {
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
      notifySingle(enrichedCount > 0 ? 'success' : 'info', `Verified: ${enrichedCount}, Pending: ${skipCount}, Errors: ${errorCount}`, {
        autoClose: 4000
      });

    } catch (err) {
      notifySingle('error', 'Enrichment failed: ' + err.message, {
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

  const addLogoToQRCode = (qrDataUrl, logoPath = '/images/icon.png') => {
    return new Promise((resolve) => {
      const qrImage = new Image();
      const logoImage = new Image();

      let loaded = 0;
      const onAssetLoaded = () => {
        loaded += 1;
        if (loaded < 2) return;

        try {
          const canvas = document.createElement('canvas');
          const size = qrImage.width || 400;
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(qrDataUrl);
            return;
          }

          ctx.drawImage(qrImage, 0, 0, size, size);

          // Draw a warm rounded background so the logo remains clear/scannable.
          const logoSize = Math.floor(size * 0.2);
          const logoX = Math.floor((size - logoSize) / 2);
          const logoY = Math.floor((size - logoSize) / 2);
          const bgPadding = Math.floor(logoSize * 0.18);
          const bgX = logoX - bgPadding;
          const bgY = logoY - bgPadding;
          const bgSize = logoSize + bgPadding * 2;
          const radius = Math.floor(bgSize * 0.2);

          ctx.fillStyle = '#fff7ea';
          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + bgSize - radius, bgY);
          ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
          ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
          ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
          ctx.lineTo(bgX + radius, bgY + bgSize);
          ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
          ctx.closePath();
          ctx.fill();

          // Soft earthy ring around logo background for a more natural look.
          ctx.strokeStyle = 'rgba(107, 68, 35, 0.35)';
          ctx.lineWidth = Math.max(1, Math.floor(size * 0.006));
          ctx.stroke();

          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          console.warn('[LaporanPage] Failed to composite QR logo:', err);
          resolve(qrDataUrl);
        }
      };

      const onError = () => resolve(qrDataUrl);

      qrImage.onload = onAssetLoaded;
      logoImage.onload = onAssetLoaded;
      qrImage.onerror = onError;
      logoImage.onerror = onError;

      qrImage.src = qrDataUrl;
      logoImage.src = logoPath;
    });
  };

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
        margin: 3,
        color: {
          dark: '#6b4423',
          light: '#fffaf0'
        },
        errorCorrectionLevel: 'H'
      });

      const qrWithLogoUrl = await addLogoToQRCode(qrUrl);

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
        url: qrWithLogoUrl,
        data: fullData,
        verified: isBlockchainComplete
      });
      
      setQrModalOpen(true);
      
      if (isBlockchainComplete) {
        notifySingle('success', 'QR Code with blockchain proof!');
      } else if (item.blockchain_doc_hash) {
        notifySingle('info', 'QR Code - Transaction processing...');
      } else {
        notifySingle('info', 'QR Code from database');
      }
      
    } catch (err) {
      console.error('[LaporanPage] QR generation error:', err);
      notifySingle('error', 'Failed to generate QR Code: ' + err.message);
    } finally {
      setLoadingBlockchain(false);
    }
  };

  const sanitizeFileName = (value) => {
    return String(value || 'laporan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'laporan';
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text) => {
    if (!text) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        tempInput.setAttribute('readonly', '');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      notifySingle('success', 'Hash berhasil dicopy');
    } catch (err) {
      console.error('[LaporanPage] copyToClipboard error:', err);
      notifySingle('error', 'Gagal copy hash ke clipboard');
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeData?.url) {
      notifySingle('warning', 'QR code belum tersedia');
      return;
    }

    try {
      const baseName = sanitizeFileName(selectedLaporan?.nama_perusahaan || `laporan-${selectedLaporan?.id || 'qr'}`);
      const qrBlob = await fetch(qrCodeData.url).then(res => res.blob());
      downloadBlob(qrBlob, `${baseName}-qr.png`);
      notifySingle('success', 'QR Code berhasil diunduh (PNG)');
    } catch (err) {
      console.error('[LaporanPage] downloadQRCode error:', err);
      notifySingle('error', `Gagal download QR: ${err.message}`);
    }
  };

  const downloadAllAsZip = async (items) => {
    if (!items?.length) {
      notifySingle('warning', 'Tidak ada data untuk diunduh');
      return;
    }

    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const generatedAt = new Date().toISOString();

      zip.file('laporan-summary.json', JSON.stringify({
        generatedAt,
        total: items.length,
        items
      }, null, 2));

      items.forEach((item) => {
        const fileBase = sanitizeFileName(`${item.id}-${item.nama_perusahaan}`);
        zip.file(`laporan/${fileBase}.json`, JSON.stringify(item, null, 2));
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `laporan-perencanaan-${Date.now()}.zip`);
      notifySingle('success', 'ZIP laporan berhasil diunduh');
    } catch (err) {
      console.error('[LaporanPage] downloadAllAsZip error:', err);
      notifySingle('error', `Gagal membuat ZIP: ${err.message}`);
    } finally {
      setDownloadingZip(false);
    }
  };

  const reuploadToBlockchain = async (item) => {
    setReuploadingId(item.id);
    try {
      const response = await api.get('/blockchain/retry', {
        params: { perencanaan_id: item.id },
        timeout: 30000
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || 'Retry broadcast gagal');
      }

      const txHash = response?.data?.tx_hash || null;
      setLaporan(prev =>
        prev.map(l =>
          l.id === item.id
            ? {
                ...l,
                blockchain_tx_hash: txHash || l.blockchain_tx_hash,
                blockchain_status: 'confirmed'
              }
            : l
        )
      );

      notifySingle('success', 'Upload ulang ke blockchain berhasil');
    } catch (err) {
      console.error('[LaporanPage] reuploadToBlockchain error:', err);
      notifySingle('error', `Upload ulang gagal: ${err.message}`);
    } finally {
      setReuploadingId(null);
    }
  };

  const getProgressInfo = (item) => {
    const hasImplementasi = !!item?.is_implemented || !!item?.implementasi;
    const hasMonitoring = !!item?.implementasi?.monitoring || (Array.isArray(item?.monitoring) && item.monitoring.length > 0);
    const hasEvaluasi = !!item?.evaluasi || !!item?.implementasi?.evaluasi || !!item?.implementasi?.monitoring?.evaluasi;
    const currentStage = hasMonitoring ? 'Monitoring' : hasImplementasi ? 'Implementasi' : 'Perencanaan';

    return {
      hasImplementasi,
      hasMonitoring,
      hasEvaluasi,
      currentStage,
    };
  };

  const getStageDetails = (item) => {
    const implementasi = item?.implementasi || null;
    const monitoring = implementasi?.monitoring || (Array.isArray(item?.monitoring) ? item.monitoring[0] : item?.monitoring || null);

    return {
      implementasi,
      monitoring,
    };
  };

  const parseStoredFiles = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {
        return [value];
      }
      return [value];
    }

    return [];
  };

  const openPDFPreview = (item) => {
    setPdfPreviewData(item);
    setPdfPreviewOpen(true);
  };

  const downloadPDFReport = async (sourceItem) => {
    const item = sourceItem || pdfPreviewData;
    if (!item) return;

    try {
      const progress = getProgressInfo(item);
      const { implementasi, monitoring } = getStageDetails(item);
      const pdfDoc = await PDFDocument.create();
      const pageSize = [595.28, 841.89];
      let page = null;
      const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const margin = 42;
      const contentWidth = 595.28 - margin * 2;
      const labelWidth = 178;
      const valueWidth = contentWidth - labelWidth - 16;
      let y = 800;
      let pageNumber = 0;

      let logoImage = null;
      try {
        const logoRes = await fetch('/images/icon.png');
        if (logoRes.ok) {
          const logoBytes = await logoRes.arrayBuffer();
          logoImage = await pdfDoc.embedPng(logoBytes);
        }
      } catch (logoErr) {
        console.warn('[LaporanPage] logo load skipped:', logoErr?.message || logoErr);
      }

      let qrCodeImage = null;
      try {
        const qrContent = item.blockchain_tx_hash 
          ? `https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`
          : `${window.location.origin}/public/laporan/${item.id}`;
        
        const qrDataUrl = await QRCode.toDataURL(
          qrContent,
          {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 200,
            color: { dark: '#1f2937', light: '#ffffff' },
          }
        );
        const qrBytes = await fetch(qrDataUrl).then(r => r.arrayBuffer());
        qrCodeImage = await pdfDoc.embedPng(qrBytes);
      } catch (qrErr) {
        console.warn('[LaporanPage] QR code generation skipped:', qrErr?.message || qrErr);
      }

      const drawText = (text, x, yPos, opts = {}) => {
        page.drawText(String(text ?? '-'), {
          x,
          y: yPos,
          size: opts.size || 11,
          font: opts.bold ? bold : regular,
          color: opts.color || rgb(0.1, 0.1, 0.1),
        });
      };

      const wrapText = (text, maxWidth, size = 11, fontRef = regular) => {
        const source = String(text ?? '-');
        const words = source.split(' ');
        const lines = [];
        let line = '';

        const breakLongWord = (word) => {
          if (fontRef.widthOfTextAtSize(word, size) <= maxWidth) return [word];
          const chunks = [];
          let chunk = '';
          for (const ch of word) {
            const test = `${chunk}${ch}`;
            if (fontRef.widthOfTextAtSize(test, size) > maxWidth && chunk) {
              chunks.push(chunk);
              chunk = ch;
            } else {
              chunk = test;
            }
          }
          if (chunk) chunks.push(chunk);
          return chunks;
        };

        for (const word of words) {
          const chunks = breakLongWord(word);
          for (const chunk of chunks) {
            const testLine = line ? `${line} ${chunk}` : chunk;
            const testWidth = fontRef.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth && line) {
              lines.push(line);
              line = chunk;
            } else {
              line = testLine;
            }
          }
        }

        if (line) lines.push(line);
        return lines;
      };

      const drawHeader = () => {
        const headerTopY = 810;

        if (logoImage) {
          page.drawImage(logoImage, {
            x: margin,
            y: headerTopY - 35,
            width: 35,
            height: 35,
          });
        }

        const headerX = logoImage ? margin + 42 : margin;
        const maxTitleWidth = contentWidth - 80;
        drawText('3TREESIFY CCS', headerX, headerTopY, { size: 13, bold: true, color: rgb(0.1, 0.32, 0.25) });
        drawText('Sistem Konservasi Berbasis Blockchain', headerX, headerTopY - 13, { size: 9, color: rgb(0.33, 0.33, 0.33) });
        drawText('Pelaporan Perencanaan, Implementasi, dan Monitoring', headerX, headerTopY - 25, { size: 8, color: rgb(0.4, 0.4, 0.4) });

        if (qrCodeImage) {
          page.drawImage(qrCodeImage, {
            x: margin + contentWidth - 62,
            y: headerTopY - 65,
            width: 60,
            height: 60,
          });
          drawText('Verifikasi', margin + contentWidth - 64, headerTopY - 68, { size: 7, color: rgb(0.45, 0.45, 0.45), bold: true });
          drawText('Dokumen', margin + contentWidth - 54, headerTopY - 75, { size: 7, color: rgb(0.45, 0.45, 0.45), bold: true });
        }

        drawText('Halaman ' + String(pageNumber), margin + contentWidth - 52, headerTopY, { size: 8.5, color: rgb(0.4, 0.4, 0.4) });

        page.drawLine({ start: { x: margin, y: headerTopY - 105 }, end: { x: margin + contentWidth, y: headerTopY - 105 }, thickness: 1.2, color: rgb(0.12, 0.42, 0.32) });
        page.drawLine({ start: { x: margin, y: headerTopY - 108 }, end: { x: margin + contentWidth, y: headerTopY - 108 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
      };

      const drawMetaBlock = () => {
        page.drawRectangle({
          x: margin,
          y: 660,
          width: contentWidth,
          height: 50,
          color: rgb(0.96, 0.98, 0.97),
          borderColor: rgb(0.8, 0.9, 0.86),
          borderWidth: 1,
        });

        drawText('Nomor Laporan', margin + 12, 702, { size: 9, bold: true, color: rgb(0.35, 0.35, 0.35) });
        drawText(String(item.id), margin + 12, 690, { size: 10.5, color: rgb(0.1, 0.1, 0.1) });

        drawText('Tanggal Cetak', margin + 190, 702, { size: 9, bold: true, color: rgb(0.35, 0.35, 0.35) });
        drawText(new Date().toLocaleString('id-ID'), margin + 190, 690, { size: 10.5, color: rgb(0.1, 0.1, 0.1) });

        drawText('Tahap Saat Ini', margin + 390, 702, { size: 9, bold: true, color: rgb(0.35, 0.35, 0.35) });
        drawText(progress.currentStage, margin + 390, 690, { size: 10.5, bold: true, color: rgb(0.1, 0.32, 0.25) });
      };

      const startNewPage = () => {
        page = pdfDoc.addPage(pageSize);
        pageNumber += 1;
        drawHeader();
        drawMetaBlock();
        y = 645;
      };

      const ensureSpace = (neededHeight = 28) => {
        if (y - neededHeight < 60) {
          startNewPage();
        }
      };

      const addField = (label, value) => {
        const lines = wrapText(value, valueWidth, 10.5, regular);
        const rowHeight = Math.max(1, lines.length) * 14 + 8;
        ensureSpace(rowHeight);

        page.drawRectangle({
          x: margin,
          y: y - rowHeight + 5,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.995, 0.995, 0.995),
          borderColor: rgb(0.92, 0.92, 0.92),
          borderWidth: 0.4,
        });

        drawText(label, margin + 8, y - 7, { size: 9.5, bold: true, color: rgb(0.35, 0.35, 0.35) });
        drawText(':', margin + labelWidth, y - 7, { size: 9.5, bold: true, color: rgb(0.4, 0.4, 0.4) });

        let valueY = y - 7;
        lines.forEach((line) => {
          drawText(line, margin + labelWidth + 10, valueY, { size: 10.5, color: rgb(0.1, 0.1, 0.1) });
          valueY -= 14;
        });

        y -= rowHeight;
      };

      const addSection = (title) => {
        ensureSpace(30);
        page.drawRectangle({
          x: margin,
          y: y - 16,
          width: contentWidth,
          height: 20,
          color: rgb(0.9, 0.96, 0.93),
          borderColor: rgb(0.72, 0.84, 0.78),
          borderWidth: 0.8,
        });
        drawText(title, margin + 8, y - 2, { size: 11, bold: true, color: rgb(0.08, 0.32, 0.25) });
        y -= 24;
      };

      const boolLabel = (value) => (value === undefined || value === null ? '-' : value ? 'Sesuai' : 'Tidak Sesuai');

      startNewPage();

      addSection('DATA PERENCANAAN');

      addField('ID Laporan', item.id);
      addField('Nama Perusahaan', item.nama_perusahaan);
      addField('Nama PIC', item.nama_pic);
      addField('Narahubung', item.narahubung || '-');
      addField('Jenis Kegiatan', item.jenis_kegiatan);
      addField('Jenis Bibit', item.jenis_bibit || '-');
      addField('Jumlah Bibit', item.jumlah_bibit ? `${item.jumlah_bibit} Unit` : '-');
      addField('Lokasi', item.lokasi || '-');
      addField('Tanggal Pelaksanaan', item.tanggal_pelaksanaan || '-');
      addField('Koordinat', `${item.lat ?? '-'}, ${item.long ?? '-'}`);

      addSection('STATUS DAN VERIFIKASI');
      addField('Status Implementasi', item.is_implemented ? 'Sudah Implementasi' : 'Belum Implementasi');
      addField('Tahap Saat Ini', progress.currentStage);
      addField('Progress Perencanaan', 'Aktif');
      addField('Progress Implementasi', progress.hasImplementasi ? 'Aktif' : 'Belum');
      addField('Progress Monitoring', progress.hasMonitoring ? 'Aktif' : 'Belum');
      addField('Progress Evaluasi', progress.hasEvaluasi ? 'Aktif' : 'Belum');
      addField('Blockchain Doc Hash', item.blockchain_doc_hash || '-');
      addField('Blockchain TX Hash', item.blockchain_tx_hash || '-');
      addField('Blockchain Verification', item.blockchainData?.verified ? 'Full Verified' : (item.blockchain_tx_hash ? 'Uploaded (Pending Verify)' : 'Not Uploaded'));

      if (progress.hasImplementasi || implementasi) {
        const implementasiDocs = parseStoredFiles(implementasi?.dokumentasi_kegiatan);
        addSection('DETAIL IMPLEMENTASI');
        addField('PIC Koorlap', implementasi?.pic_koorlap || '-');
        addField('Kesesuaian Nama Perusahaan', boolLabel(implementasi?.nama_perusahaan_sesuai));
        addField('Kesesuaian Lokasi', boolLabel(implementasi?.lokasi_sesuai));
        addField('Kesesuaian Jenis Kegiatan', boolLabel(implementasi?.jenis_kegiatan_sesuai));
        addField('Kesesuaian Jumlah Bibit', boolLabel(implementasi?.jumlah_bibit_sesuai));
        addField('Kesesuaian Jenis Bibit', boolLabel(implementasi?.jenis_bibit_sesuai));
        addField('Kesesuaian Tanggal', boolLabel(implementasi?.tanggal_sesuai));
        addField('Geotagging Implementasi', implementasi?.geotagging || '-');
        addField('Koordinat Implementasi', `${implementasi?.lat ?? '-'}, ${implementasi?.long ?? '-'}`);
        addField('Dokumentasi Implementasi', implementasiDocs.length > 0 ? `${implementasiDocs.length} file` : '-');
      }

      if (progress.hasMonitoring || monitoring) {
        const monitoringDocs = parseStoredFiles(monitoring?.dokumentasi_monitoring);
        addSection('DETAIL MONITORING');
        addField('Jumlah Bibit Ditanam', monitoring?.jumlah_bibit_ditanam ?? '-');
        addField('Jumlah Bibit Mati', monitoring?.jumlah_bibit_mati ?? '-');
        addField('Diameter Batang', monitoring?.diameter_batang ? `${monitoring.diameter_batang} cm` : '-');
        addField('Jumlah Daun', monitoring?.jumlah_daun ?? '-');
        addField('Survival Rate', monitoring?.survival_rate !== undefined && monitoring?.survival_rate !== null ? `${monitoring.survival_rate}%` : '-');
        addField('Kondisi Daun Mengering', monitoring?.daun_mengering ?? '-');
        addField('Kondisi Daun Layu', monitoring?.daun_layu ?? '-');
        addField('Kondisi Daun Menguning', monitoring?.daun_menguning ?? '-');
        addField('Bercak Daun', monitoring?.bercak_daun ?? '-');
        addField('Serangan Hama/Serangga', monitoring?.daun_serangga ?? '-');
        addField('Dokumentasi Monitoring', monitoringDocs.length > 0 ? `${monitoringDocs.length} file` : '-');
      }

      page.drawLine({ start: { x: margin, y: 46 }, end: { x: margin + contentWidth, y: 46 }, thickness: 0.6, color: rgb(0.76, 0.76, 0.76) });
      drawText('Dokumen ini dihasilkan otomatis oleh 3TREESIFY CCS. QR code di atas dapat digunakan untuk memverifikasi keaslian dokumen.', margin, 33, { size: 8.5, color: rgb(0.45, 0.45, 0.45) });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, `laporan-perencanaan-${item.id}.pdf`);
      notifySingle('success', 'PDF berhasil diunduh');
      setPdfPreviewOpen(false);
    } catch (err) {
      console.error('[LaporanPage] downloadPDFReport error:', err);
      notifySingle('error', `Gagal membuat PDF: ${err.message}`);
    }
  };

  const generatePDF = async (item) => {
    openPDFPreview(item);
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
      
      notifySingle('success', !currentStatus ? 'Ditandai sebagai sudah implementasi' : 'Status implementasi dibatalkan');
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

    const progress = getProgressInfo(item);
    const currentStage = progress.currentStage;

    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "perencanaan" && currentStage === "Perencanaan") ||
      (filterStatus === "implementasi" && currentStage === "Implementasi") ||
      (filterStatus === "monitoring" && currentStage === "Monitoring") ||
      (filterStatus === "evaluasi" && progress.hasEvaluasi);
    
    return matchSearch && matchStatus;
  });

  // ✅ Pagination calculation
  const totalPages = Math.ceil(filteredLaporan.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLaporan.slice(indexOfFirstItem, indexOfLastItem);
  const previewProgress = pdfPreviewData ? getProgressInfo(pdfPreviewData) : null;
  const previewDetails = pdfPreviewData ? getStageDetails(pdfPreviewData) : { implementasi: null, monitoring: null };

  if (loading) return <LoadingSpinner show={true} message="Memuat laporan dari blockchain..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
              <FiFileText className="text-emerald-600" /> 
              Laporan Perencanaan
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FiFileText className="w-3.5 h-3.5" />
                {filteredLaporan.length} laporan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <FiLink className="w-3.5 h-3.5" />
                {laporan.filter(l => l.blockchain_tx_hash).length} TX Hash
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                <FiCheckCircle className="w-3.5 h-3.5" />
                {laporan.filter(l => l.blockchainData?.verified).length} Verified
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                isReady
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isReady ? <FiCheck className="w-3.5 h-3.5" /> : <FiClock className="w-3.5 h-3.5" />}
                {isReady ? 'Sepolia Ready' : 'Blockchain Loading'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full md:w-56 md:grid-cols-1 md:pt-1">
            <motion.button
              onClick={() => downloadAllAsZip(filteredLaporan)}
              disabled={downloadingZip || filteredLaporan.length === 0}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                downloadingZip || filteredLaporan.length === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white shadow-md'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiArchive className="w-4 h-4" />
              <span>{downloadingZip ? 'Membuat ZIP...' : `Download ZIP (${filteredLaporan.length})`}</span>
            </motion.button>

            <motion.button
              onClick={fetchLaporan}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </motion.button>
          </div>
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
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-3xl shadow-md p-4 md:p-5 mb-5 border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-4">
            {/* Row 1: Search + Filter */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
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
                  <option value="all">Semua</option>
                  <option value="perencanaan">Perencanaan</option>
                  <option value="implementasi">Implementasi</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="evaluasi">Evaluasi</option>
                </select>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 text-sm">
              <div className="md:col-span-1 text-center">No</div>
              <div className="md:col-span-4">Perusahaan</div>
              <div className="md:col-span-4 flex items-center gap-1.5"><FiHash className="w-4 h-4" />Hash Transaksi Blockchain (Sepolia)</div>
              <div className="md:col-span-3 text-center">Status</div>
            </div>

            {/* Table Body - UPDATED dengan hash display yang benar */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 hover:bg-emerald-50/50 dark:hover:bg-gray-700/50 transition-all items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* No */}
                  <div className="md:col-span-1 flex justify-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      {indexOfFirstItem + index + 1}
                    </span>
                  </div>

                  {/* Perusahaan */}
                  <div className="md:col-span-4 md:min-w-0">
                    {item.blockchain_doc_hash && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.blockchain_doc_hash)}
                        className="mb-2 w-full text-left rounded-md border border-blue-200/70 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/20 px-2 py-1.5 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 transition-colors"
                        title="Klik untuk copy Document Hash"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold mb-0.5 inline-flex items-center gap-1">
                          <FiHash className="w-3 h-3" />
                          Document Hash
                          <FiCopy className="w-3 h-3 ml-1 opacity-80" />
                        </p>
                        <code className="block text-[11px] font-mono text-blue-700 dark:text-blue-300 break-all leading-snug max-w-full">
                          {item.blockchain_doc_hash.substring(0, 36)}...
                        </code>
                      </button>
                    )}
                    <p className="font-semibold text-gray-900 dark:text-gray-100 break-words leading-snug">
                      {item.nama_perusahaan}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {item.id}</p>
                  </div>

                  {/* ✅ Hash Transaksi Blockchain - SIMPLIFIED STATUS LOGIC */}
                  <div className="md:col-span-4">
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
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                            <FiCheckCircle className="w-3 h-3" /> Uploaded to Blockchain (Sepolia)
                          </span>
                        </div>

                        {/* Real TX Hash Display */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                            Sepolia Transaction Hash
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

                        {/* Blockchain Verification Status */}
                        {item.blockchainData?.verified ? (
                          <motion.div
                            className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 rounded-lg p-2 border border-green-200 dark:border-green-700"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                          >
                            <FiCheck className="w-4 h-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                            <span className="text-xs font-bold text-green-700 dark:text-green-300">
                              Smart contract verified (Doc ID: {item.blockchainData.docId})
                            </span>
                          </motion.div>
                        ) : (
                          <motion.div
                            className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 border border-blue-200 dark:border-blue-700"
                          >
                            <FiClock className="w-4 h-4 text-blue-700 dark:text-blue-300 flex-shrink-0" />
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                              Uploaded to blockchain. Smart contract verification is pending.
                            </span>
                          </motion.div>
                        )}
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
                          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <FiClock className="w-3 h-3" /> Processing - Awaiting blockchain confirmation
                          </span>
                        </div>
                        
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 space-y-2">
                          <div className="pt-2 border-t border-yellow-200 dark:border-yellow-700">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
                              <strong>Status:</strong> Waiting for blockchain transaction to be mined
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              This usually takes 1-5 minutes on Sepolia network
                            </p>
                            <motion.button
                              onClick={() => reuploadToBlockchain(item)}
                              disabled={reuploadingId === item.id}
                              className={`mt-3 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                reuploadingId === item.id
                                  ? 'bg-yellow-300/70 text-yellow-900 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm'
                              }`}
                              whileHover={reuploadingId === item.id ? undefined : { scale: 1.02 }}
                              whileTap={reuploadingId === item.id ? undefined : { scale: 0.98 }}
                            >
                              {reuploadingId === item.id ? 'Re-uploading...' : 'Upload Ulang ke Blockchain'}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>

                    ) : (
                      /* ✅ CASE 3: No blockchain data = DATABASE ONLY */
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs">Database only - No blockchain integration</span>
                      </div>
                    )}
                  </div>

                  {/* ✅ SIMPLIFIED Status Column */}
                  <div className="md:col-span-3 flex justify-center">
                    <div className="flex flex-col items-center justify-center gap-2 w-full">
                      {(() => {
                        const hasImplementasi = !!item.is_implemented || !!item.implementasi;
                        const hasMonitoring = !!item.implementasi?.monitoring || (Array.isArray(item.monitoring) && item.monitoring.length > 0);
                        const currentStage = hasMonitoring ? 'Monitoring' : hasImplementasi ? 'Implementasi' : 'Perencanaan';

                        const stageClass = (active) =>
                          active
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600';

                        return (
                          <>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 inline-flex items-center gap-1">
                              <FiCheckCircle className="w-3 h-3" />
                              Tahap Saat Ini: {currentStage}
                            </span>

                            <div className="flex items-center justify-center gap-1.5 w-full">
                              <span className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${stageClass(true)}`}>
                                Perencanaan
                              </span>
                              <FiChevronRight className="w-3 h-3 text-gray-400" />
                              <span className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${stageClass(hasImplementasi)}`}>
                                Implementasi
                              </span>
                              <FiChevronRight className="w-3 h-3 text-gray-400" />
                              <span className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${stageClass(hasMonitoring)}`}>
                                Monitoring
                              </span>
                            </div>
                          </>
                        );
                      })()}

                      {/* ✅ SIMPLIFIED Action Buttons - Remove Verify button */}
                      <div className="flex gap-2 mt-1 w-full justify-center">

                        {/* QR Code Generation */}
                        <motion.button
                          onClick={() => generateBlockchainQRCode(item)}
                          disabled={loadingBlockchain && selectedLaporan?.id === item.id}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border shadow-sm transition-all ${
                            item.blockchainData?.verified
                              ? 'bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                              : 'bg-sky-500/10 border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title={item.blockchainData?.verified ? "Generate blockchain-verified QR" : "Generate QR from database"}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <span>QR</span>
                        </motion.button>

                        {/* PDF Generation */}
                        <motion.button
                          onClick={() => generatePDF(item)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 shadow-sm flex items-center gap-1.5 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Download PDF report"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
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
                      {qrCodeData.verified ? 'Verified dari Blockchain' : 'Data dari Database'}
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
                    <span>Download QR (PNG)</span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}

          {pdfPreviewOpen && pdfPreviewData && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPdfPreviewOpen(false)}
              />
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setPdfPreviewOpen(false)}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setPdfPreviewOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Preview Laporan PDF
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                    Semua isi form dan status akan dimasukkan ke PDF.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">ID:</span> {pdfPreviewData.id}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Tahap Saat Ini:</span> {previewProgress?.currentStage}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2"><span className="font-semibold">Nama Perusahaan:</span> {pdfPreviewData.nama_perusahaan}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Nama PIC:</span> {pdfPreviewData.nama_pic || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Narahubung:</span> {pdfPreviewData.narahubung || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jenis Kegiatan:</span> {pdfPreviewData.jenis_kegiatan || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jenis Bibit:</span> {pdfPreviewData.jenis_bibit || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Bibit:</span> {pdfPreviewData.jumlah_bibit || '-'} Unit</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Status Implementasi:</span> {pdfPreviewData.is_implemented ? 'Sudah Implementasi' : 'Belum Implementasi'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2"><span className="font-semibold">Lokasi:</span> {pdfPreviewData.lokasi || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Tanggal Pelaksanaan:</span> {pdfPreviewData.tanggal_pelaksanaan || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Koordinat:</span> {pdfPreviewData.lat ?? '-'}, {pdfPreviewData.long ?? '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2"><span className="font-semibold">Blockchain Doc Hash:</span> {pdfPreviewData.blockchain_doc_hash || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2"><span className="font-semibold">Blockchain TX Hash:</span> {pdfPreviewData.blockchain_tx_hash || '-'}</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2"><span className="font-semibold">Status Verifikasi Blockchain:</span> {pdfPreviewData.blockchainData?.verified ? 'Full Verified' : (pdfPreviewData.blockchain_tx_hash ? 'Uploaded (Pending Verify)' : 'Not Uploaded')}</div>

                    {(previewProgress?.hasImplementasi || previewDetails?.implementasi) && (
                      <>
                        <div className="md:col-span-2 mt-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-semibold">
                          Detail Implementasi
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">PIC Koorlap:</span> {previewDetails?.implementasi?.pic_koorlap || '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Geotagging:</span> {previewDetails?.implementasi?.geotagging || '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Nama Perusahaan Sesuai:</span> {previewDetails?.implementasi?.nama_perusahaan_sesuai === undefined || previewDetails?.implementasi?.nama_perusahaan_sesuai === null ? '-' : (previewDetails?.implementasi?.nama_perusahaan_sesuai ? 'Sesuai' : 'Tidak Sesuai')}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Lokasi Sesuai:</span> {previewDetails?.implementasi?.lokasi_sesuai === undefined || previewDetails?.implementasi?.lokasi_sesuai === null ? '-' : (previewDetails?.implementasi?.lokasi_sesuai ? 'Sesuai' : 'Tidak Sesuai')}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jenis Kegiatan Sesuai:</span> {previewDetails?.implementasi?.jenis_kegiatan_sesuai === undefined || previewDetails?.implementasi?.jenis_kegiatan_sesuai === null ? '-' : (previewDetails?.implementasi?.jenis_kegiatan_sesuai ? 'Sesuai' : 'Tidak Sesuai')}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Bibit Sesuai:</span> {previewDetails?.implementasi?.jumlah_bibit_sesuai === undefined || previewDetails?.implementasi?.jumlah_bibit_sesuai === null ? '-' : (previewDetails?.implementasi?.jumlah_bibit_sesuai ? 'Sesuai' : 'Tidak Sesuai')}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jenis Bibit Sesuai:</span> {previewDetails?.implementasi?.jenis_bibit_sesuai === undefined || previewDetails?.implementasi?.jenis_bibit_sesuai === null ? '-' : (previewDetails?.implementasi?.jenis_bibit_sesuai ? 'Sesuai' : 'Tidak Sesuai')}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Tanggal Sesuai:</span> {previewDetails?.implementasi?.tanggal_sesuai === undefined || previewDetails?.implementasi?.tanggal_sesuai === null ? '-' : (previewDetails?.implementasi?.tanggal_sesuai ? 'Sesuai' : 'Tidak Sesuai')}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2"><span className="font-semibold">Dokumentasi Implementasi:</span> {parseStoredFiles(previewDetails?.implementasi?.dokumentasi_kegiatan).length > 0 ? `${parseStoredFiles(previewDetails?.implementasi?.dokumentasi_kegiatan).length} file` : '-'}</div>
                      </>
                    )}

                    {(previewProgress?.hasMonitoring || previewDetails?.monitoring) && (
                      <>
                        <div className="md:col-span-2 mt-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300 font-semibold">
                          Detail Monitoring
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Bibit Ditanam:</span> {previewDetails?.monitoring?.jumlah_bibit_ditanam ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Bibit Mati:</span> {previewDetails?.monitoring?.jumlah_bibit_mati ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Diameter Batang:</span> {previewDetails?.monitoring?.diameter_batang ? `${previewDetails?.monitoring?.diameter_batang} cm` : '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Daun:</span> {previewDetails?.monitoring?.jumlah_daun ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Survival Rate:</span> {previewDetails?.monitoring?.survival_rate !== undefined && previewDetails?.monitoring?.survival_rate !== null ? `${previewDetails?.monitoring?.survival_rate}%` : '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Mengering:</span> {previewDetails?.monitoring?.daun_mengering ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Layu:</span> {previewDetails?.monitoring?.daun_layu ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Menguning:</span> {previewDetails?.monitoring?.daun_menguning ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Bercak Daun:</span> {previewDetails?.monitoring?.bercak_daun ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Serangga:</span> {previewDetails?.monitoring?.daun_serangga ?? '-'}</div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2"><span className="font-semibold">Dokumentasi Monitoring:</span> {parseStoredFiles(previewDetails?.monitoring?.dokumentasi_monitoring).length > 0 ? `${parseStoredFiles(previewDetails?.monitoring?.dokumentasi_monitoring).length} file` : '-'}</div>
                      </>
                    )}
                  </div>

                  <motion.button
                    onClick={() => downloadPDFReport(pdfPreviewData)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-medium shadow-lg transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiDownload className="w-5 h-5" />
                    <span>Download PDF</span>
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