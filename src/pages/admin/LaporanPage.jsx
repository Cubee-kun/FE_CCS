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

// ✅ GLOBAL THROTTLE & TIMEOUT CONFIG
let lastEnrichmentTime = 0;
const MIN_ENRICHMENT_INTERVAL = 60000; // 60 detik
const POLL_TIMEOUT = 5000; // 5 detik timeout

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

  // ✅ Fetch blockchain transaction hashes setelah data loaded
  useEffect(() => {
    if (isReady && laporan.length > 0) {
      // ✅ THROTTLE: Only call full enrichment every 60 seconds
      const now = Date.now();
      if (now - lastEnrichmentTime > MIN_ENRICHMENT_INTERVAL) {
        lastEnrichmentTime = now;
        enrichLaporanWithBlockchainData();
      } else {
        console.log('[LaporanPage] Skipping enrichment (throttled)');
      }
    }
  }, [isReady, laporan.length]);

  // ✅ MAIN: Fetch laporan dari API dengan INCREASED TIMEOUT & RETRY
  const fetchLaporan = async (retries = 3, page = 1, perPage = 25) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[LaporanPage] Fetching laporan (page ${page}, ${perPage} per page)...`);
      
      const response = await api.get(
        `/perencanaan?page=${page}&per_page=${perPage}`,
        { timeout: 30000 }
      );

      const rawData = response.data?.data || [];
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
        console.warn(`[LaporanPage] Timeout! Retrying with smaller batch (${retries} left)...`);
        toast.warning(`⏳ API lambat, coba loading dengan data lebih sedikit...`, { autoClose: 3000 });
        
        await new Promise(r => setTimeout(r, 2000));
        return fetchLaporan(retries - 1, page, Math.floor(perPage / 2));
      }

      // ✅ FALLBACK: Show error & load minimal data
      setError('⏱️ API timeout - loading dari cache atau minimal data');
      toast.error('❌ Timeout: Backend lambat. Silakan refresh atau tunggu beberapa saat.');
      
      if (retries === 0) {
        try {
          console.log('[LaporanPage] Fallback: Fetching minimal data (10 items only)...');
          const fallbackResponse = await api.get('/perencanaan?per_page=10', {
            timeout: 15000,
          });
          const minimalList = (fallbackResponse.data?.data || []).map(transformBlockchainData);
          setLaporan(minimalList);
          toast.info(`💡 Loaded minimal data (${minimalList.length} items)`, { autoClose: 2000 });
        } catch (fallbackErr) {
          console.error('[LaporanPage] Fallback also failed:', fallbackErr.message);
          setLaporan([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Polling: Re-fetch pending items setiap 20 detik (REDUCED from 30s)
  useEffect(() => {
    if (laporan.length === 0) return;

    const pendingItems = laporan.filter(l => l.blockchain_doc_hash && !l.blockchain_tx_hash);
    if (pendingItems.length === 0) return;

    console.log(`[LaporanPage] Starting polling for ${pendingItems.length} pending blockchain items...`);

    const pollInterval = setInterval(async () => {
      try {
        // ✅ Process in small batches to avoid 429 rate limit
        const batchSize = 3;
        for (let i = 0; i < pendingItems.length; i += batchSize) {
          const batch = pendingItems.slice(i, i + batchSize);
          
          for (const item of batch) {
            try {
              const response = await api.get(`/perencanaan/${item.id}`);
              const updated = transformBlockchainData(response.data?.data || response.data);

              if (updated.blockchain_tx_hash && !item.blockchain_tx_hash) {
                console.log(`✅ Item ${item.id}: blockchain confirmed!`, updated.blockchain_tx_hash);
                toast.success(`🔗 ${updated.nama_perusahaan} blockchain verified!`);

                setLaporan(prev => 
                  prev.map(l => l.id === item.id ? updated : l)
                );
              }
            } catch (err) {
              console.warn(`[LaporanPage] Poll error for item ${item.id}:`, err.message);
            }
          }
          
          // ✅ Delay between batches to avoid rate limiting
          if (i + batchSize < pendingItems.length) {
            await new Promise(r => setTimeout(r, 1200));
          }
        }
      } catch (err) {
        console.warn('[LaporanPage] Poll error:', err.message);
      }
    }, 20000); // Check setiap 20 detik (REDUCED from 15s to avoid 429)

    return () => clearInterval(pollInterval);
  }, [laporan]);

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
  // filepath: c:\Xampp\htdocs\CCS-project\FE_CCS\src\pages\admin\LaporanPage.jsx

  // ✅ ENRICHMENT: Modified to handle rate limiting gracefully
  const enrichLaporanWithBlockchainData = async () => {
    if (laporan.length === 0 || !isReady) return;

    console.log('[LaporanPage] Starting blockchain enrichment via frontend service...');
    
    const cache = { ...blockchainCache };
    let enrichedCount = 0;
    let errorCount = 0;
    
    let updatedLaporan = [...laporan];
    const batchSize = 3;
    
    for (let i = 0; i < updatedLaporan.length; i += batchSize) {
      const batch = updatedLaporan.slice(i, i + batchSize);
      
      const promises = batch.map(async (item) => {
        const cacheKey = item.id;
        const cachedData = cache[cacheKey];
        const cacheAge = cachedData?.timestamp ? Date.now() - new Date(cachedData.timestamp).getTime() : Infinity;
        
        if (cachedData && cacheAge < 300000) { // 5 minutes cache
          return { ...item, blockchainData: cachedData };
        }

        let blockchainData = null;

        if (item.blockchain_doc_hash) {
          try {
            console.log(`[LaporanPage] Verifying item ${item.id} on blockchain...`);
            
            const verificationResult = await Promise.race([
              verifyDocumentHash(item.blockchain_doc_hash),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Verification timeout')), 10000)
              )
            ]);

            if (verificationResult.verified) {
              blockchainData = {
                docHash: item.blockchain_doc_hash,
                docId: verificationResult.docId,
                txHash: null,
                verified: true,
                status: 'CONFIRMED',
                timestamp: new Date().toISOString(),
                timestampISO: verificationResult.timestampISO,
                uploader: verificationResult.uploader,
                metadata: verificationResult.metadata
              };
              
              if (item.blockchain_tx_hash) {
                try {
                  const txProof = await Promise.race([
                    getTransactionProof(item.blockchain_tx_hash),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('TX proof timeout')), 8000)
                    )
                  ]);
                  
                  if (txProof) {
                    blockchainData = {
                      ...blockchainData,
                      txHash: item.blockchain_tx_hash,
                      blockNumber: txProof.blockNumber,
                      gasUsed: txProof.gasUsed,
                      gasPrice: txProof.gasPrice,
                      confirmations: txProof.confirmations,
                      explorerUrl: txProof.explorerUrl,
                      status: 'VERIFIED'
                    };
                  }
                } catch (txErr) {
                  console.warn(`[LaporanPage] TX proof failed for ${item.blockchain_tx_hash}:`, txErr.message);
                }
              }
              
              enrichedCount++;
              console.log(`[LaporanPage] ✅ Item ${item.id}: Blockchain ${blockchainData.status.toLowerCase()}`);
            } else {
              blockchainData = {
                docHash: item.blockchain_doc_hash,
                verified: false,
                status: 'PENDING_BLOCKCHAIN',
                timestamp: new Date().toISOString(),
                error: verificationResult.error
              };
            }
          } catch (err) {
            console.warn(`[LaporanPage] Error verifying item ${item.id}:`, err.message);
            errorCount++;
            
            blockchainData = {
              docHash: item.blockchain_doc_hash,
              verified: false,
              status: err.message.includes('timeout') ? 'TIMEOUT' : 'ERROR',
              timestamp: new Date().toISOString(),
              error: err.message
            };
          }
          
          cache[cacheKey] = blockchainData;
          return { ...item, blockchainData };
        } else {
          cache[cacheKey] = null;
          return { ...item, blockchainData: null };
        }
      });

      const batchResults = await Promise.all(promises);
      updatedLaporan.splice(i, batchSize, ...batchResults);
      
      // ✅ Progressive delay - shorter for smaller batches
      if (i + batchSize < updatedLaporan.length) {
        const delay = Math.min(2000 + (errorCount * 500), 5000); // 2s base + 0.5s per error, max 5s
        console.log(`[LaporanPage] Waiting ${delay}ms before next batch (errors: ${errorCount})...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    // Update state
    setBlockchainCache(cache);
    setLaporan(updatedLaporan);
    
    console.log(`[LaporanPage] ✅ Blockchain enrichment complete:`, {
      total: updatedLaporan.length,
      verified: enrichedCount,
      errors: errorCount,
    });

    // ✅ Show appropriate toast messages
    if (enrichedCount > 0) {
      toast.success(`✅ ${enrichedCount} documents verified on blockchain`);
    }
    if (errorCount > 0) {
      toast.warning(`⚠️ ${errorCount} verification errors (akan dicoba lagi)`);
    }
  };

  // ✅ Generate blockchain QR with frontend verification
  const generateBlockchainQRCode = async (item) => {
    setSelectedLaporan(item);
    setLoadingBlockchain(true);
    
    try {
      console.log('[LaporanPage] Generating blockchain QR code...');
      
      let blockchainData = null;
      
      // ✅ Verify on blockchain using frontend service
      if (item.blockchain_doc_hash && isReady) {
        try {
          const verificationResult = await verifyDocumentHash(item.blockchain_doc_hash);
          if (verificationResult.verified) {
            blockchainData = verificationResult;
            console.log('[LaporanPage] ✅ Blockchain verification successful');
          }
        } catch (err) {
          console.warn('[LaporanPage] Blockchain verification failed:', err.message);
        }
      }

      const qrData = {
        type: 'PERENCANAAN_BLOCKCHAIN',
        timestamp: new Date().toISOString(),
        verification: {
          blockchainVerified: !!blockchainData,
          docHash: item.blockchain_doc_hash || null,
          txHash: item.blockchain_tx_hash || null,
          docId: blockchainData?.docId || null,
          verificationUrl: blockchainData 
            ? `https://3treesify-ccs.netlify.app/verify/${item.blockchain_doc_hash}`
            : null,
          source: blockchainData ? "SEPOLIA_BLOCKCHAIN" : "DATABASE"
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
          blockchain_doc_hash: item.blockchain_doc_hash,
          blockchain_tx_hash: item.blockchain_tx_hash,
          created_at: item.created_at
        },
        blockchainProof: blockchainData || null
      };

      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: blockchainData ? '#10b981' : '#3b82f6',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setQrCodeData({
        url: qrUrl,
        data: qrData,
        verified: !!blockchainData
      });
      
      setQrModalOpen(true);
      toast.success(blockchainData 
        ? "🔗 QR Code with blockchain proof!" 
        : "📱 QR Code from database");
      
    } catch (err) {
      console.error('[LaporanPage] QR generation error:', err);
      toast.error("❌ Failed to generate QR Code: " + err.message);
    } finally {
      setLoadingBlockchain(false);
    }
  };

  // ✅ Fetch blockchain data untuk dokumen spesifik
  const fetchBlockchainData = async (item) => {
    if (!isReady) {
      toast.warning("⚠️ Blockchain service belum siap");
      return;
    }

    setLoadingBlockchain(true);
    try {
      const verificationResult = await verifyDocumentHash(item.blockchain_doc_hash);
      
      if (verificationResult.verified) {
        toast.success("🔗 Data blockchain berhasil diverifikasi");
      } else {
        toast.warning("⚠️ Document tidak ditemukan di blockchain");
      }
    } catch (err) {
      console.error("Blockchain fetch error:", err);
      toast.error("❌ Gagal verifikasi blockchain: " + err.message);
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

  // ✅ Generate PDF dari Laporan
  const generatePDF = async (item) => {
    try {
      toast.info("📄 Membuat PDF...", { autoClose: 2000 });
      
      const { PDFDocument, rgb } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { height } = page.getSize();
      
      let yPosition = height - 50;
      
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
      
      const details = [
        `Perusahaan: ${item.nama_perusahaan}`,
        `PIC: ${item.nama_pic}`,
        `Narahubung: ${item.narahubung}`,
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
      
      const laporan_folder = zip.folder('Laporan');
      const qr_folder = zip.folder('QR_Codes');
      const json_folder = zip.folder('JSON_Data');
      
      toast.info(`📦 Membuat ZIP dengan ${itemsToZip.length} file...`, { autoClose: 2000 });
      
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
          
          const qrBase64 = qrDataURL.split(',')[1];
          const qrBlob = new Blob([Buffer.from(qrBase64, 'base64')], { type: 'image/png' });
          qr_folder.file(`${item.id}-QR.png`, qrBlob);
          
          json_folder.file(`${item.id}-data.json`, JSON.stringify(qrData, null, 2));
        } catch (err) {
          console.warn(`Gagal membuat QR untuk item ${item.id}:`, err);
        }
      }
      
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
            🔗 {laporan.filter(l => l.blockchainData?.txHash).length} verified blockchain •
            {isReady ? '✅ Blockchain Ready' : '⏳ Blockchain Loading'}
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

                  {/* ✅ Hash Transaksi Blockchain - UPDATED DISPLAY */}
                  <div className="md:col-span-5">
                    {item.blockchainData ? (
                      <>
                        {item.blockchainData?.verified && item.blockchainData?.status === 'VERIFIED' ? (
                          // ✅ VERIFIED: Full blockchain verification with tx hash
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
                                ✅ VERIFIED ON BLOCKCHAIN
                              </span>
                            </div>

                            {/* TX Hash Display */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                                🔗 Transaction Hash
                              </p>
                              <code className="text-xs font-mono text-emerald-700 dark:text-emerald-300 break-all flex items-center gap-2">
                                {item.blockchainData.txHash ? (
                                  <>
                                    {item.blockchainData.txHash.substring(0, 30)}...
                                    <motion.a
                                      href={item.blockchainData.explorerUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex-shrink-0"
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="View on Etherscan"
                                    >
                                      <FiExternalLink className="w-3.5 h-3.5" />
                                    </motion.a>
                                  </>
                                ) : (
                                  <span className="text-yellow-600">⏳ TX Hash pending...</span>
                                )}
                              </code>
                            </div>

                            {/* Document Hash Display */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                                📝 Document Hash
                              </p>
                              <code className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">
                                {item.blockchainData.docHash.substring(0, 30)}...
                              </code>
                            </div>

                            {/* Blockchain Details Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Block Number */}
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                  📦 Block
                                </p>
                                <p className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                                  {item.blockchainData?.blockNumber 
                                    ? `#${item.blockchainData.blockNumber.toLocaleString()}` 
                                    : '⏳ Pending'}
                                </p>
                              </div>

                              {/* Document ID */}
                              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                  🆔 Doc ID
                                </p>
                                <p className="text-sm font-mono font-bold text-orange-700 dark:text-orange-300">
                                  {item.blockchainData?.docId || 'N/A'}
                                </p>
                              </div>

                              {/* Gas Used */}
                              {item.blockchainData?.gasUsed && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                    ⛽ Gas Used
                                  </p>
                                  <p className="text-sm font-mono font-bold text-amber-700 dark:text-amber-300">
                                    {(item.blockchainData.gasUsed / 1000).toFixed(1)}K
                                  </p>
                                </div>
                              )}

                              {/* Confirmations */}
                              {item.blockchainData?.confirmations !== undefined && (
                                <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                    ✓ Confirmations
                                  </p>
                                  <p className="text-sm font-mono font-bold text-cyan-700 dark:text-cyan-300">
                                    {item.blockchainData.confirmations}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Verified Badge */}
                            <motion.div
                              className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 rounded-lg p-2 border border-green-200 dark:border-green-700"
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                            >
                              <FiCheck className="w-4 h-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                              <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                ✅ Document verified on Sepolia blockchain
                              </span>
                            </motion.div>
                          </motion.div>
                        ) : item.blockchainData?.verified && item.blockchainData?.status === 'CONFIRMED' ? (
                          // ✅ CONFIRMED: Document found on blockchain but no tx details yet
                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="flex items-center gap-2">
                              <motion.div
                                className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              ></motion.div>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                ✅ CONFIRMED ON BLOCKCHAIN
                              </span>
                            </div>
                            
                            {/* Document Hash Display */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 space-y-2">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                                  📝 Document Hash (Verified ✅)
                                </p>
                                <code className="text-xs font-mono text-emerald-700 dark:text-emerald-300 break-all block bg-white dark:bg-gray-800 p-2 rounded">
                                  {item.blockchainData.docHash}
                                </code>
                              </div>

                              {/* Blockchain Info */}
                              {item.blockchainData.docId && (
                                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-700">
                                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                                    🔗 Blockchain Document ID: {item.blockchainData.docId}
                                  </p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                    📅 Verified: {new Date(item.blockchainData.timestampISO).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              
                              {/* Status Info */}
                              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-700">
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">
                                  💡 <strong>Status:</strong> Document successfully stored and verified on blockchain
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ) : item.blockchainData?.docHash && !item.blockchainData?.verified ? (
                          // ✅ PENDING: Doc hash exists but not yet verified on blockchain
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
                                ⏳ PENDING BLOCKCHAIN VERIFICATION
                              </span>
                            </div>
                            
                            {/* Doc Hash Display */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 space-y-2">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                                  📝 Document Hash (Waiting for verification)
                                </p>
                                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all block bg-white dark:bg-gray-800 p-2 rounded">
                                  {item.blockchainData.docHash}
                                </code>
                              </div>
                              
                              {/* Status Info */}
                              <div className="pt-2 border-t border-yellow-200 dark:border-yellow-700">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
                                  💡 <strong>Status:</strong> Document hash generated, waiting for blockchain verification
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                  ⏱️ This usually takes a few seconds to complete
                                </p>
                              </div>

                              {/* Error Info (if any) */}
                              {item.blockchainData.error && (
                                <div className="pt-2 border-t border-yellow-200 dark:border-yellow-700">
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    ⚠️ Error: {item.blockchainData.error}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ) : (
                          // ✅ ERROR or UNKNOWN state
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs">❓ Unknown blockchain status</span>
                          </div>
                        )}
                      </>
                    ) : (
                      // ✅ No blockchain data
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs">📋 Not on blockchain</span>
                      </div>
                    )}
                  </div>

                  {/* Status - UPDATED */}
                  <div className="md:col-span-3">
                    <div className="flex gap-2 flex-wrap items-center">
                      {/* ✅ UPDATED: Status badges berdasarkan verification result */}
                      {item.blockchainData?.verified && item.blockchainData?.status === 'VERIFIED' ? (
                        // Full verification with TX hash
                        <motion.span 
                          className="px-2 py-1 rounded text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          <FiCheck className="w-3 h-3" />
                          Verified + TX
                        </motion.span>
                      ) : item.blockchainData?.verified && item.blockchainData?.status === 'CONFIRMED' ? (
                        // Document confirmed on blockchain
                        <motion.span 
                          className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          <FiShield className="w-3 h-3" />
                          Blockchain ✓
                        </motion.span>
                      ) : item.blockchainData?.docHash ? (
                        // Pending verification
                        <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                          <FiRefreshCw className="w-3 h-3 animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        // Database only
                        <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          📋 Database Only
                        </span>
                      )}
                      
                      {/* ✅ Implementation status */}
                      {item.is_implemented && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          ✅ Implemented
                        </span>
                      )}

                      {/* ✅ FIXED: Action Buttons Row */}
                      <div className="flex gap-1 mt-2 w-full">
                        {/* QR Code Generation Button */}
                        <motion.button
                          onClick={() => generateBlockchainQRCode(item)}
                          disabled={loadingBlockchain && selectedLaporan?.id === item.id}
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                            item.blockchainData?.verified
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                          } ${loadingBlockchain && selectedLaporan?.id === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          whileHover={loadingBlockchain && selectedLaporan?.id === item.id ? {} : { scale: 1.05 }}
                          whileTap={loadingBlockchain && selectedLaporan?.id === item.id ? {} : { scale: 0.95 }}
                          title={item.blockchainData?.verified ? "Generate blockchain-verified QR" : "Generate QR from database"}
                        >
                          {loadingBlockchain && selectedLaporan?.id === item.id ? (
                            <motion.div
                              className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          )}
                          <span>QR</span>
                        </motion.button>

                        {/* PDF Generation Button */}
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

                        {/* Blockchain Explorer Link (if tx_hash exists) */}
                        {item.blockchain_tx_hash && (
                          <motion.a
                            href={`https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 flex items-center gap-1 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="View on Etherscan"
                          >
                            <FiExternalLink className="w-3 h-3" />
                            <span>Explorer</span>
                          </motion.a>
                        )}

                        {/* Blockchain Verification Button (if doc_hash exists but not verified) */}
                        {item.blockchain_doc_hash && !item.blockchainData?.verified && (
                          <motion.button
                            onClick={() => fetchBlockchainData(item)}
                            disabled={loadingBlockchain}
                            className="px-2 py-1 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 flex items-center gap-1 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Verify on blockchain"
                          >
                            <FiShield className="w-3 h-3" />
                            <span>Verify</span>
                          </motion.button>
                        )}

                        {/* Implementation Status Toggle */}
                        <motion.button
                          onClick={() => toggleImplementasiStatus(item.id, item.is_implemented)}
                          disabled={updatingStatus === item.id}
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                            item.is_implemented 
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                          } ${updatingStatus === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          whileHover={updatingStatus === item.id ? {} : { scale: 1.05 }}
                          whileTap={updatingStatus === item.id ? {} : { scale: 0.95 }}
                          title={item.is_implemented ? "Mark as planning" : "Mark as implemented"}
                        >
                          {updatingStatus === item.id ? (
                            <motion.div
                              className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          ) : item.is_implemented ? (
                            <FiX className="w-3 h-3" />
                          ) : (
                            <FiCheck className="w-3 h-3" />
                          )}
                          <span>{item.is_implemented ? 'Undo' : 'Done'}</span>
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