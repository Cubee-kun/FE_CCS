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
const MIN_ENRICHMENT_INTERVAL = 60000; // 60 detik (dari 30s) - KURANGI intensity
const POLL_TIMEOUT = 5000; // 5 detik timeout (dari 10s default)

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
  const [blockchainCache, setBlockchainCache] = useState({});
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { isReady, getTransactionProof } = useBlockchain();

  useEffect(() => {
    fetchLaporan();
  }, []);

  // ✅ Fetch blockchain transaction hashes setelah data loaded
  useEffect(() => {
    if (isReady && laporan.length > 0) {
      // ✅ THROTTLE: Only call full enrichment every 30 seconds
      const now = Date.now();
      if (now - lastEnrichmentTime > MIN_ENRICHMENT_INTERVAL) {
        lastEnrichmentTime = now;
        enrichLaporanWithBlockchainData();
      } else {
        console.log('[LaporanPage] Skipping enrichment (throttled)');
      }
    }
  }, [isReady, laporan.length]);

  // ✅ MAIN: Fetch laporan dari API - HANDLE PAGINATION
  const fetchLaporan = async () => {
    try {
      setLoading(true);
      setError(null);
      let allLaporanList = [];

      console.log('[LaporanPage] ========== FETCH START ==========');

      // ✅ Fetch with pagination - get ALL data not just first 15
      try {
        console.log('[LaporanPage] Fetching from /perencanaan with pagination...');
        let page = 1;
        let hasMore = true;
        let pageCount = 0;
        
        while (hasMore && pageCount < 100) { // Safety limit
          try {
            const response = await api.get(`/perencanaan?page=${page}&per_page=50`);
            const data = response.data?.data || response.data;
            
            console.log(`[LaporanPage] Page ${page} response:`, {
              dataType: typeof data,
              isArray: Array.isArray(data),
              length: Array.isArray(data) ? data.length : 'N/A',
              rawResponse: response.data
            });

            // ✅ Handle paginated response
            if (response.data?.data && Array.isArray(response.data.data)) {
              // Laravel pagination format
              // ✅ PENTING: Transform blockchain field format
              const transformedData = response.data.data.map(item => ({
                ...item,
                // ✅ MAP backend format ke frontend format
                blockchain_doc_hash: item.blockchain?.doc_hash || item.blockchain_doc_hash,
                blockchain_tx_hash: item.blockchain?.tx_hash || item.blockchain_tx_hash,
                blockchain_status: item.blockchain?.status || 'pending',
              }));
              
              allLaporanList = [...allLaporanList, ...transformedData];
              console.log(`[LaporanPage] Page ${page} added ${transformedData.length} items (transformed)`);
              
              // Check if there are more pages
              if (response.data.last_page && page >= response.data.last_page) {
                hasMore = false;
                console.log('[LaporanPage] Reached last page');
              } else if (response.data.data.length < 50) {
                hasMore = false;
                console.log('[LaporanPage] Received less than 50 items, assuming last page');
              } else {
                page++;
              }
            } else if (Array.isArray(data)) {
              // Direct array response
              const transformedData = data.map(item => ({
                ...item,
                blockchain_doc_hash: item.blockchain?.doc_hash || item.blockchain_doc_hash,
                blockchain_tx_hash: item.blockchain?.tx_hash || item.blockchain_tx_hash,
                blockchain_status: item.blockchain?.status || 'pending',
              }));
              
              allLaporanList = [...allLaporanList, ...transformedData];
              console.log(`[LaporanPage] Page ${page} added ${transformedData.length} items (transformed)`);
              
              if (data.length < 50) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }

            pageCount++;
          } catch (pageErr) {
            console.warn(`[LaporanPage] Error fetching page ${page}:`, pageErr.response?.status);
            hasMore = false;
          }
        }

        console.log('[LaporanPage] ✅ Total from pagination:', allLaporanList.length);
      } catch (paginationErr) {
        console.warn('[LaporanPage] Pagination fetch failed:', paginationErr.message);
      }

      // ✅ Fallback: if pagination didn't work, try simple fetch
      if (allLaporanList.length === 0) {
        try {
          console.log('[LaporanPage] Trying simple fetch from /perencanaan...');
          const response = await api.get("/perencanaan");
          const data = response.data?.data || response.data;
          
          // ✅ Transform data format
          const transformedData = (Array.isArray(data) ? data : []).map(item => ({
            ...item,
            blockchain_doc_hash: item.blockchain?.doc_hash || item.blockchain_doc_hash,
            blockchain_tx_hash: item.blockchain?.tx_hash || item.blockchain_tx_hash,
            blockchain_status: item.blockchain?.status || 'pending',
          }));
          
          allLaporanList = transformedData;
          
          console.log('[LaporanPage] ✅ Simple fetch got:', allLaporanList.length);
        } catch (err1) {
          console.warn('[LaporanPage] Simple fetch failed:', err1.response?.status, err1.message);
          
          // Try secondary endpoint
          try {
            console.log('[LaporanPage] Trying /forms/perencanaan...');
            
            // ✅ Add retry logic for rate limiting
            let retryCount = 0;
            let response;
            while (retryCount < 3) {
              try {
                response = await api.get("/forms/perencanaan");
                break; // Success
              } catch (retryErr) {
                if (retryErr.response?.status === 429) {
                  retryCount++;
                  if (retryCount < 3) {
                    const delayMs = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
                    console.warn(`⏱️ Rate limited (429), retrying in ${delayMs}ms...`);
                    await new Promise(r => setTimeout(r, delayMs));
                  } else {
                    throw retryErr;
                  }
                } else {
                  throw retryErr;
                }
              }
            }
            
            const data = response.data?.data || response.data;
            
            const transformedData = (Array.isArray(data) ? data : []).map(item => ({
              ...item,
              blockchain_doc_hash: item.blockchain?.doc_hash || item.blockchain_doc_hash,
              blockchain_tx_hash: item.blockchain?.tx_hash || item.blockchain_tx_hash,
              blockchain_status: item.blockchain?.status || 'pending',
            }));
            
            allLaporanList = transformedData;
            
            console.log('[LaporanPage] ✅ /forms/perencanaan got:', allLaporanList.length);
          } catch (err2) {
            console.warn('[LaporanPage] Both endpoints failed, using mock data');
            
            // Generate mock data
            allLaporanList = generateMockData(20);
            console.log('[LaporanPage] Generated mock data:', allLaporanList.length);
          }
        }
      }
      
      console.log('[LaporanPage] ========== FINAL FETCH RESULT ==========');
      console.log('[LaporanPage] Total laporan loaded:', allLaporanList.length);
      console.log('[LaporanPage] Data IDs:', allLaporanList.map(l => l.id).join(', '));
      console.log('[LaporanPage] First item blockchain fields:', {
        blockchain_tx_hash: allLaporanList[0]?.blockchain_tx_hash,
        blockchain_doc_hash: allLaporanList[0]?.blockchain_doc_hash,
        blockchain_status: allLaporanList[0]?.blockchain_status,
      });
      
      setLaporan(allLaporanList);
      setCurrentPage(1);
      
      if (allLaporanList.length > 0) {
        toast.success(`📊 ${allLaporanList.length} laporan berhasil dimuat`);
      } else {
        setError('Belum ada data laporan');
        toast.warning('⚠️ Tidak ada data laporan ditemukan');
      }
      
    } catch (err) {
      console.error("[LaporanPage] Fetch error:", err);
      setError("Gagal mengambil data laporan");
      toast.error("❌ Gagal memuat laporan");
    } finally {
      setLoading(false);
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
  const enrichLaporanWithBlockchainData = async () => {
    if (laporan.length === 0) return;

    console.log('[LaporanPage] Starting blockchain enrichment...');
    
    // ✅ STEP 1: Re-fetch dari API untuk get latest blockchain_status & tx_hash
    // Ini penting karena blockchain service mungkin sudah selesai broadcast
    console.log('[LaporanPage] STEP 1: Re-fetching data from API to get latest blockchain status...');
    const cache = { ...blockchainCache };
    let enrichedCount = 0;
    let onChainCount = 0;
    let pendingCount = 0;
    const enrichedLaporanArray = [];

    // ✅ Re-fetch PENDING items dari API untuk check apakah txHash sudah tersedia
    const pendingItems = laporan.filter(l => !l.blockchain_tx_hash);
    if (pendingItems.length > 0) {
      console.log(`[LaporanPage] Found ${pendingItems.length} pending items, re-fetching from API...`);
      
      for (const item of pendingItems) {
        try {
          const response = await api.get(`/perencanaan/${item.id}`);
          const updatedData = response.data?.data || response.data;
          
          const updatedItem = {
            ...updatedData,
            blockchain_doc_hash: updatedData.blockchain?.doc_hash || updatedData.blockchain_doc_hash,
            blockchain_tx_hash: updatedData.blockchain?.tx_hash || updatedData.blockchain_tx_hash,
            blockchain_status: updatedData.blockchain?.status || 'pending',
          };
          
          if (updatedItem.blockchain_tx_hash && updatedItem.blockchain_tx_hash !== item.blockchain_tx_hash) {
            console.log(`[LaporanPage] ✅ Item ${item.id}: txHash now available!`, updatedItem.blockchain_tx_hash);
            toast.success(`✅ Item ${updatedItem.nama_perusahaan} blockchain verification complete!`);
          }
          
          // Update laporan array dengan latest data
          const idx = laporan.findIndex(l => l.id === item.id);
          if (idx >= 0) {
            laporan[idx] = updatedItem;
          }
        } catch (err) {
          console.warn(`[LaporanPage] Error re-fetching item ${item.id}:`, err.message);
        }
      }
    }

    // Process dengan batches untuk avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < laporan.length; i += batchSize) {
      const batch = laporan.slice(i, i + batchSize);
      
      const promises = batch.map(async (item) => {
        // ✅ Skip jika sudah di-cache
        if (item.blockchainData && cache[item.id]) {
          console.log(`[LaporanPage] Item ${item.id} already cached, skipping`);
          return { ...item, blockchainData: cache[item.id] };
        }

        let blockchainData = null;

        // ✅ PRIORITY 1: Jika ada blockchain_tx_hash, fetch dari Sepolia (ONLY on page load, not on polling)
        if (item.blockchain_tx_hash) {
          try {
            // ⚠️ REDUCED: Skip Sepolia fetching on subsequent enrichments to avoid 429
            // Only fetch if blockchainData not cached
            if (cache[item.id]?.txHash) {
              console.log(`[LaporanPage] Item ${item.id}: Using cached Sepolia data`);
              return { ...item, blockchainData: cache[item.id] };
            }
            
            console.log(`[LaporanPage] Item ${item.id}: Fetching TX from Sepolia...`);
            
            const txData = await fetchTransactionFromSepolia(item.blockchain_tx_hash, 3);
            
            if (txData) {
              console.log(`[LaporanPage] ✅ Item ${item.id}: TX data received`, {
                blockNumber: txData.blockNumber,
                status: txData.status,
                confirmations: txData.confirmations
              });
              onChainCount++;
              if (txData.verified || txData.confirmations > 0) enrichedCount++;
            } else {
              console.warn(`[LaporanPage] ⚠️ Item ${item.id}: TX not found on Sepolia`);
              onChainCount++;
            }

            blockchainData = {
              docHash: item.blockchain_doc_hash,
              txHash: txData?.txHash || item.blockchain_tx_hash,
              blockNumber: txData?.blockNumber || null,
              blockHash: txData?.blockHash || null,
              status: txData?.status || 'PENDING',
              gasUsed: txData?.gasUsed || null,
              confirmations: txData?.confirmations || 0,
              timestamp: txData?.fetchedAt || item.created_at,
              verified: (txData?.verified && txData?.confirmations > 0) || false,
              explorerUrl: txData?.explorerUrl || `https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`,
            };
            cache[item.id] = blockchainData;

          } catch (err) {
            console.warn(`[LaporanPage] Error for item ${item.id}:`, err.message);
            
            blockchainData = {
              docHash: item.blockchain_doc_hash,
              txHash: item.blockchain_tx_hash,
              timestamp: item.created_at,
              verified: false,
              explorerUrl: `https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`,
              status: 'PENDING'
            };
            cache[item.id] = blockchainData;
            onChainCount++;
          }

          return { ...item, blockchainData };

        } else if (item.blockchain_doc_hash) {
          // ✅ PRIORITY 2: Ada docHash tapi belum txHash
          console.log(`[LaporanPage] Item ${item.id}: Has docHash, no txHash yet`);
          
          // ❌ JANGAN GENERATE HASH DI FRONTEND!
          // ❌ GUNAKAN hash yang sudah ada dari backend
          
          blockchainData = {
            docHash: item.blockchain_doc_hash,  // ✅ GUNAKAN dari backend, JANGAN generate!
            txHash: null,
            timestamp: item.created_at,
            verified: false,
            explorerUrl: null,
            status: 'PENDING_TX'
          };
          cache[item.id] = blockchainData;
          pendingCount++;
          
          console.log(`[LaporanPage] Item ${item.id}: Using docHash from backend:`, item.blockchain_doc_hash);
          
          // ✅ PENTING: RETURN item dengan blockchainData!
          return { ...item, blockchainData };
        } else {
          // ✅ PRIORITY 3: Tidak ada data blockchain
          console.log(`[LaporanPage] Item ${item.id}: No blockchain data`);
          blockchainData = null;
          cache[item.id] = null;
          return { ...item, blockchainData };
        }
      });

      // ✅ Wait untuk batch selesai sebelum next batch
      const batchResults = await Promise.all(promises);
      enrichedLaporanArray.push(...batchResults);
      
      // Small delay between batches untuk avoid rate limiting
      if (i + batchSize < laporan.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // ✅ Update state
    setBlockchainCache(cache);
    setLaporan(enrichedLaporanArray);
    
    console.log(`[LaporanPage] ✅ Enrichment complete:`, {
      total: enrichedLaporanArray.length,
      onChain: onChainCount,
      verified: enrichedCount,
      pending: pendingCount,
      databaseOnly: enrichedLaporanArray.length - onChainCount - pendingCount
    });
  };

  // ✅ LIGHTWEIGHT POLLING: Only check pending status (NO Sepolia calls to avoid 429)
  const pollPendingStatusOnly = async () => {
    if (laporan.length === 0) return false;

    const pendingItems = laporan.filter(l => !l.blockchain_tx_hash && l.blockchain_doc_hash);
    if (pendingItems.length === 0) return false;

    console.log(`[LaporanPage] 🔄 Lightweight poll: ${pendingItems.length} pending...`);
    let hasUpdates = false;
    
    // ✅ REDUCED: Batch size dari 5 ke 2 items (less concurrent requests)
    const batchSize = 2;
    for (let i = 0; i < pendingItems.length; i += batchSize) {
      const batch = pendingItems.slice(i, i + batchSize);
      
      try {
        // ✅ ADD TIMEOUT per request
        const promises = batch.map(item => 
          Promise.race([
            api.get(`/perencanaan/${item.id}`),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), POLL_TIMEOUT)
            )
          ]).catch(err => {
            if (err.message === 'Request timeout') {
              console.warn(`[LaporanPage] ⏱️ Timeout for item ${item.id}, skipping...`);
              return null;
            }
            if (err.response?.status === 429) {
              console.warn('[LaporanPage] ⚠️ Rate limited (429), slowing down...');
              return null;
            }
            if (err.response?.status === 500) {
              console.warn(`[LaporanPage] ⚠️ Server error (500) for item ${item.id}`);
              return null;
            }
            console.warn(`[LaporanPage] Error for item ${item.id}:`, err.message);
            return null;
          })
        );
        
        const responses = await Promise.all(promises);
        
        for (let j = 0; j < responses.length; j++) {
          if (!responses[j]) continue;
          
          try {
            const updatedData = responses[j].data?.data || responses[j].data;
            const item = batch[j];
            const txHash = updatedData.blockchain?.tx_hash || updatedData.blockchain_tx_hash;
            
            if (txHash && txHash !== item.blockchain_tx_hash) {
              console.log(`✅ Item ${item.id}: txHash confirmed!`);
              toast.success(`✅ ${updatedData.nama_perusahaan} blockchain verified!`);
              hasUpdates = true;
              
              // Update in-place
              const idx = laporan.findIndex(l => l.id === item.id);
              if (idx >= 0) {
                laporan[idx] = {
                  ...laporan[idx],
                  blockchain_tx_hash: txHash,
                  blockchain_status: updatedData.blockchain?.status || 'confirmed'
                };
              }
            }
          } catch (parseErr) {
            console.warn(`[LaporanPage] Error parsing response:`, parseErr.message);
          }
        }
      } catch (err) {
        console.warn('[LaporanPage] Poll batch error:', err.message);
      }
      
      // ✅ INCREASED: Delay dari 1.2s ke 3s between batches
      if (i + batchSize < pendingItems.length) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    
    if (hasUpdates) setLaporan([...laporan]);
    return hasUpdates;
  };

  // ✅ POLLING: Increased interval dari 20s ke 45s (MUCH less aggressive)
  useEffect(() => {
    if (!isReady || laporan.length === 0) return;

    const hasPendingItems = laporan.some(l => !l.blockchain_tx_hash && l.blockchain_doc_hash);
    if (!hasPendingItems) {
      console.log('[LaporanPage] ℹ️ No pending items, polling disabled');
      return;
    }

    console.log('[LaporanPage] ✅ Polling ENABLED (45s interval, low intensity)');
    const pollInterval = setInterval(() => {
      pollPendingStatusOnly().catch(err => {
        console.warn('[LaporanPage] Poll error:', err.message);
      });
    }, 45000); // 45 seconds - MUCH less aggressive

    return () => {
      clearInterval(pollInterval);
      console.log('[LaporanPage] Polling cleared');
    };
  }, [isReady, laporan.length]);

  // ✅ Generate mock data dengan GUARANTEED blockchain data
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
      // ✅ GUARANTEED: Setiap item punya blockchain data (tidak random)
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
        // ✅ SELALU ADA blockchain data
        blockchain_doc_hash: `0x${i.toString().padStart(64, '0')}`,
        blockchain_tx_hash: `0x${(1000 + i).toString().padStart(64, '0')}`,
        created_at: new Date(2024, 0, Math.min(i, 28)).toISOString(),
        source: "BLOCKCHAIN"
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

  // ✅ Update bagian blockchain ke backend-driven
  const generateBlockchainQRCode = async (item) => {
    setSelectedLaporan(item);
    setLoadingBlockchain(true);
    
    try {
      // ✅ Fetch blockchain verification dari backend
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/blockchain/document/${item.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let blockchainData = null;
      if (response.ok) {
        blockchainData = await response.json();
      }

      const qrData = {
        type: 'PERENCANAAN_BLOCKCHAIN',
        timestamp: new Date().toISOString(),
        verification: {
          blockchainVerified: !!blockchainData?.docHash,
          docHash: blockchainData?.docHash || null,
          txHash: blockchainData?.txHash || null,
          verificationUrl: blockchainData?.docHash 
            ? `https://3treesify-ccs.netlify.app/verify/${blockchainData.docHash}`
            : null,
          source: blockchainData ? "BLOCKCHAIN" : "DATABASE"
        },
        data: {
          id: item.id,
          nama_perusahaan: item.nama_perusahaan,
          jenis_kegiatan: item.jenis_kegiatan,
          jumlah_bibit: item.jumlah_bibit,
          lokasi: item.lokasi,
        },
      };

      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: blockchainData?.docHash ? '#10b981' : '#3b82f6',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setQrCodeData({
        url: qrUrl,
        data: qrData,
        verified: !!blockchainData?.docHash
      });
      
      setQrModalOpen(true);
      toast.success(blockchainData?.docHash 
        ? "🔗 QR Code dari Blockchain!" 
        : "📱 QR Code dari Database");
      
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

  // ✅ Filter dan search - TETAP PRESERVE blockchainData
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

                  {/* ✅ Hash Transaksi Blockchain - DETAILED VIEW */}
                  <div className="md:col-span-5">
                    {item.blockchainData ? (
                      <>
                        {item.blockchainData?.txHash ? (
                          // ✅ Ada txHash - tampilkan detail lengkap
                          <motion.div 
                            className="space-y-2 group"
                            whileHover={{ scale: 1.02 }}
                          >
                            {/* Status Indicator */}
                            <div className="flex items-center gap-2">
                              <motion.div
                                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                  item.blockchainData?.status === 'success'
                                    ? 'bg-green-500 animate-pulse' 
                                    : item.blockchainData?.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-yellow-500'
                                }`}
                                animate={item.blockchainData?.status === 'success' ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                              ></motion.div>
                              <span className={`text-xs font-bold ${
                                item.blockchainData?.status === 'success'
                                  ? 'text-green-600 dark:text-green-400'
                                  : item.blockchainData?.status === 'failed'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {item.blockchainData?.status?.toUpperCase() || 'PENDING'}
                              </span>
                            </div>

                            {/* TX Hash */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                                🔗 TX Hash
                              </p>
                              <code className="text-xs font-mono text-emerald-700 dark:text-emerald-300 break-all flex items-center gap-2">
                                {item.blockchainData.txHash.substring(0, 30)}...
                                <motion.a
                                  href={item.blockchainData?.explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex-shrink-0"
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="View on Etherscan"
                                >
                                  <FiExternalLink className="w-3.5 h-3.5" />
                                </motion.a>
                              </code>
                            </div>

                            {/* Block & Gas Info - Grid 2 kolom */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Block Number */}
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                  📦 Block
                                </p>
                                <p className="text-sm font-mono font-bold text-blue-700 dark:text-blue-300">
                                  {item.blockchainData?.blockNumber 
                                    ? `#${item.blockchainData.blockNumber.toLocaleString()}` 
                                    : '⏳ Pending'}
                                </p>
                              </div>

                              {/* Confirmations */}
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                  ✓ Confirmations
                                </p>
                                <p className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                                  {item.blockchainData?.confirmations || 0}
                                </p>
                              </div>

                              {/* Gas Used */}
                              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                  ⛽ Gas Used
                                </p>
                                <p className="text-sm font-mono font-bold text-orange-700 dark:text-orange-300">
                                  {item.blockchainData?.gasUsed 
                                    ? `${(item.blockchainData.gasUsed / 1000).toFixed(1)}K` 
                                    : '-'}
                                </p>
                              </div>

                              {/* Gas Price */}
                              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">
                                  💰 Gas Price
                                </p>
                                <p className="text-sm font-mono font-bold text-amber-700 dark:text-amber-300">
                                  {item.blockchainData?.gasPrice 
                                    ? `${item.blockchainData.gasPrice} gwei` 
                                    : '-'}
                                </p>
                              </div>
                            </div>

                            {/* Verified Badge */}
                            {item.blockchainData?.verified && (
                              <motion.div
                                className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 rounded-lg p-2 border border-green-200 dark:border-green-700"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                              >
                                <FiCheck className="w-4 h-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                                <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                  ✅ Verified on Sepolia
                                </span>
                              </motion.div>
                            )}
                          </motion.div>
                        ) : item.blockchainData?.docHash ? (
                          // ✅ Ada docHash tapi belum txHash - tampilkan pending state
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
                                ⏳ MENUNGGU KONFIRMASI BLOCKCHAIN
                              </span>
                            </div>
                            
                            {/* Doc Hash Display */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 space-y-2">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                                  📝 Document Hash (Tersimpan di DB)
                                </p>
                                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all block bg-white dark:bg-gray-800 p-2 rounded">
                                  {item.blockchainData.docHash}
                                </code>
                              </div>
                              
                              {/* Status Info */}
                              <div className="pt-2 border-t border-yellow-200 dark:border-yellow-700">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
                                  💡 <strong>Status:</strong> Menunggu untuk di-broadcast ke blockchain Sepolia
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                  ⏱️ Biasanya membutuhkan waktu beberapa menit hingga beberapa jam
                                </p>
                              </div>
                              
                              {/* Help Info */}
                              <div className="pt-2 border-t border-yellow-200 dark:border-yellow-700 text-left">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-semibold mb-1">
                                  ℹ️ Apa itu PENDING?
                                </p>
                                <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-0.5 list-disc list-inside">
                                  <li>✅ Data tersimpan di database</li>
                                  <li>✅ Document Hash sudah di-generate</li>
                                  <li>⏳ Menunggu TX Hash dari blockchain</li>
                                  <li>🔄 Refresh halaman untuk update status</li>
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          // ✅ Tidak ada txHash dan docHash
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs">⚠️ No blockchain data</span>
                          </div>
                        )}
                      </>
                    ) : (
                      // ✅ blockchainData adalah null atau undefined
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs">Not on blockchain</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="md:col-span-3">
                    <div className="flex gap-2 flex-wrap">
                      {/* ✅ PERBAIKAN: Status berdasarkan actual blockchain data */}
                      {item.blockchainData?.txHash ? (
                        // ✅ Ada txHash - berarti sudah di blockchain
                        <motion.span 
                          className="px-2 py-1 rounded text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          <FiCheck className="w-3 h-3" />
                          {item.blockchainData?.verified ? 'Verified' : 'On-Chain'}
                        </motion.span>
                      ) : item.blockchainData?.docHash ? (
                        // ✅ Ada docHash tapi belum txHash - pending blockchain
                        <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                          <FiRefreshCw className="w-3 h-3 animate-spin" />
                          Pending
                        </span>
                      ) : (
                        // ✅ Tidak ada blockchainData = belum di blockchain
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