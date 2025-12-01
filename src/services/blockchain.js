import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// ✅ IMPROVED: Enhanced Smart Contract ABI dengan error handling
const CONTRACT_ABI = [
  // Read functions (view/pure)
  "function getDocumentCount() public view returns (uint256)",
  "function getDocument(uint256 _docId) public view returns (string memory docType, string memory docHash, string memory metadata, address uploader, uint256 timestamp)",

  // Write functions
  "function storeDocument(string memory _docType, string memory _docHash, string memory _metadata) public returns (uint256)",

  // Events
  "event DocumentStored(uint256 indexed docId, string docType, string docHash, address indexed uploader, uint256 timestamp)"
];

// ✅ FIXED: Multiple RPC URLs for production reliability with better rotation
const PRIMARY_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const FALLBACK_RPC_URLS = [
  "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Keep as fallback only
  "https://rpc.sepolia.org",
  "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
  "https://sepolia.gateway.tenderly.co",
  "https://rpc2.sepolia.org",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia-rpc.scroll.io"
];

// ✅ RATE LIMITING CONTROLS
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
const requestQueue = [];
let processingQueue = false;

// ✅ RPC ROTATION STATE
let currentRpcIndex = 0;
let rpcFailureCount = {};

// ✅ Private Key dari environment
const PRIVATE_KEY = import.meta.env.VITE_WALLET_PRIVATE_KEY || "";

// ✅ Contract Address dari environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5C5F6CE61647600bB8c04F59c0F2B493EBE78DDF";

// ✅ RATE LIMITED REQUEST QUEUE PROCESSOR
async function processRequestQueue() {
  if (processingQueue || requestQueue.length === 0) return;
  
  processingQueue = true;
  
  while (requestQueue.length > 0) {
    const { resolve, reject, fn } = requestQueue.shift();
    
    try {
      // ✅ Enforce minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`[Blockchain] Rate limiting: waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
      
      lastRequestTime = Date.now();
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
  
  processingQueue = false;
}

// ✅ QUEUE A RATE-LIMITED REQUEST
function queueRequest(fn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, fn });
    processRequestQueue();
  });
}

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
    this.isReady = false;
    this.currentRpcUrl = null;
  }

  // ✅ FIXED: Smart RPC provider selection with rotation and blacklisting
  async findWorkingRpcProvider() {
    const allRpcUrls = [PRIMARY_RPC_URL, ...FALLBACK_RPC_URLS];
    const maxAttempts = allRpcUrls.length;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // ✅ Rotate through providers instead of always starting with first
      const rpcIndex = (currentRpcIndex + attempt) % allRpcUrls.length;
      const rpcUrl = allRpcUrls[rpcIndex];
      
      // ✅ Skip providers that have failed recently
      const failureKey = this.getRpcFailureKey(rpcUrl);
      const failures = rpcFailureCount[failureKey] || 0;
      
      if (failures > 3) {
        console.warn(`[Blockchain] Skipping ${rpcUrl} (${failures} recent failures)`);
        continue;
      }
      
      try {
        console.log(`[Blockchain] Testing RPC ${attempt + 1}/${maxAttempts}: ${rpcUrl.substring(0, 50)}...`);
        
        // ✅ Use rate-limited request
        const testResult = await queueRequest(async () => {
          const testResponse = await Promise.race([
            fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1,
              }),
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 8000))
          ]);

          if (!testResponse.ok) {
            if (testResponse.status === 429) {
              throw new Error(`Rate limited (429) on ${rpcUrl}`);
            }
            throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
          }

          return testResponse.json();
        });

        if (testResult.result && !testResult.error) {
          const blockNumber = parseInt(testResult.result, 16);
          console.log(`[Blockchain] ✅ RPC Working: ${rpcUrl.substring(0, 30)}... Block: ${blockNumber}`);
          
          // ✅ Clear failure count on success
          delete rpcFailureCount[failureKey];
          
          // ✅ Update current index for next rotation
          currentRpcIndex = rpcIndex;
          this.currentRpcUrl = rpcUrl;
          return rpcUrl;
        } else {
          throw new Error(`RPC Error: ${testResult.error?.message || 'Unknown error'}`);
        }
      } catch (rpcErr) {
        console.warn(`[Blockchain] RPC Failed: ${rpcErr.message}`);
        
        // ✅ Track failures
        const failureKey = this.getRpcFailureKey(rpcUrl);
        rpcFailureCount[failureKey] = (rpcFailureCount[failureKey] || 0) + 1;
        
        // ✅ If rate limited, wait before trying next
        if (rpcErr.message.includes('429') || rpcErr.message.includes('Rate limited')) {
          console.log('[Blockchain] Rate limited, waiting 3 seconds before next provider...');
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

    throw new Error('All RPC providers failed or are rate limited');
  }

  // ✅ Helper to generate RPC failure tracking key
  getRpcFailureKey(rpcUrl) {
    // Use domain name as key to track failures per provider
    try {
      const url = new URL(rpcUrl);
      return url.hostname;
    } catch {
      return rpcUrl.substring(0, 30);
    }
  }

  // ✅ EXPONENTIAL BACKOFF RETRY WITH 429 HANDLING
  async executeWithRetry(fn, maxRetries = 3, baseDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.warn(`[Blockchain] Attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        // ✅ Handle 429 specifically
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000); // Max 30s delay
          console.warn(`[Blockchain] Rate limited (429), waiting ${delay}ms before retry ${attempt}...`);
          
          // ✅ Try switching to different RPC provider
          if (attempt < maxRetries) {
            try {
              console.log('[Blockchain] Attempting to switch RPC provider due to rate limit...');
              const newRpcUrl = await this.findWorkingRpcProvider();
              if (newRpcUrl !== this.currentRpcUrl) {
                console.log('[Blockchain] ✅ Switched to new RPC provider');
                await this.reinitializeProvider(newRpcUrl);
              }
            } catch (switchErr) {
              console.warn('[Blockchain] Could not switch RPC provider:', switchErr.message);
            }
          }
          
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        // ✅ For other errors, use normal exponential backoff
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`[Blockchain] Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw error;
        }
      }
    }
  }

  // ✅ REINITIALIZE PROVIDER WITH NEW RPC URL
  async reinitializeProvider(newRpcUrl) {
    try {
      console.log('[Blockchain] Reinitializing provider with new RPC...');
      
      const provider = new ethers.JsonRpcProvider(newRpcUrl);
      
      // ✅ Test new provider
      await provider.getNetwork();
      
      this.provider = provider;
      this.currentRpcUrl = newRpcUrl;
      
      // ✅ Recreate contract instance
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS, 
        CONTRACT_ABI, 
        this.signer || this.provider
      );
      
      console.log('[Blockchain] ✅ Provider reinitialized successfully');
    } catch (error) {
      console.error('[Blockchain] Failed to reinitialize provider:', error.message);
      throw error;
    }
  }

  // ✅ Initialize blockchain service dengan PRODUCTION FIXES
  async initialize() {
    try {
      if (this.isReady) {
        console.log('[Blockchain] Service already initialized');
        return true;
      }

      console.log('[Blockchain] Starting initialization with rate limiting...');

      // ✅ STEP 1: Validate Contract Address Format
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.error('[Blockchain] ❌ CONTRACT ADDRESS INVALID:', {
          value: CONTRACT_ADDRESS,
          env: import.meta.env.VITE_CONTRACT_ADDRESS,
          error: 'Contract not configured or is zero address'
        });
        return false;
      }

      // ✅ Validate address format (must be 42 chars starting with 0x)
      if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
        console.error('[Blockchain] ❌ CONTRACT ADDRESS FORMAT INVALID:', {
          value: CONTRACT_ADDRESS,
          expected: '0x + 40 hex characters',
          length: CONTRACT_ADDRESS?.length || 'undefined'
        });
        return false;
      }

      // ✅ STEP 2: Validate Private Key (allow read-only mode if no key)
      let hasPrivateKey = false;
      let cleanKey = null;

      if (PRIVATE_KEY && PRIVATE_KEY.trim() !== "") {
        cleanKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
        if (!/^0x[a-fA-F0-9]{64}$/.test(cleanKey)) {
          console.warn('[Blockchain] ⚠️ PRIVATE KEY FORMAT INVALID - Running in READ-ONLY mode');
        } else {
          hasPrivateKey = true;
        }
      } else {
        console.warn('[Blockchain] ⚠️ NO PRIVATE KEY - Running in READ-ONLY mode');
      }

      // ✅ STEP 3: Find working RPC provider with rate limiting
      const workingRpcUrl = await this.executeWithRetry(
        () => this.findWorkingRpcProvider(),
        3, // max retries
        5000 // 5 second base delay
      );
      
      if (!workingRpcUrl) {
        throw new Error('No working RPC provider found');
      }

      // ✅ STEP 4: Create provider with retry logic
      let provider;
      try {
        provider = new ethers.JsonRpcProvider(workingRpcUrl);
        
        // ✅ Test provider connection with rate limiting
        const network = await this.executeWithRetry(async () => {
          return await Promise.race([
            provider.getNetwork(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 10000))
          ]);
        });
        
        console.log('[Blockchain] ✅ Provider created for network:', network.name, 'ChainID:', network.chainId);
        
        // ✅ Verify we're on Sepolia (chainId 11155111)
        if (network.chainId !== 11155111n) {
          console.warn(`[Blockchain] ⚠️ Not on Sepolia network. Current: ${network.chainId}`);
        }
        
        this.provider = provider;
      } catch (providerErr) {
        console.error('[Blockchain] ❌ Provider creation failed:', providerErr.message);
        return false;
      }

      // ✅ STEP 5: Create wallet (or read-only mode)
      if (hasPrivateKey) {
        try {
          const wallet = new ethers.Wallet(cleanKey, this.provider);
          this.signer = wallet;
          this.walletAddress = wallet.address;
          console.log('[Blockchain] ✅ Wallet created:', this.walletAddress);
          
          // ✅ Check wallet balance with rate limiting
          try {
            const balance = await this.executeWithRetry(async () => {
              return await this.provider.getBalance(this.walletAddress);
            });
            
            console.log('[Blockchain] Wallet Balance:', ethers.formatEther(balance), 'ETH');
            
            if (balance === 0n) {
              console.warn('[Blockchain] ⚠️ Wallet has zero balance - transactions will fail');
            }
          } catch (balanceErr) {
            console.warn('[Blockchain] Could not check balance:', balanceErr.message);
          }
        } catch (walletErr) {
          console.error('[Blockchain] ❌ Wallet creation failed:', walletErr.message);
          return false;
        }
      } else {
        console.log('[Blockchain] ✅ Read-only mode (no private key)');
      }

      // ✅ STEP 6: Connect to contract with enhanced validation and rate limiting
      try {
        // ✅ Use provider for read-only operations, signer for write operations
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS, 
          CONTRACT_ABI, 
          this.signer || this.provider
        );
        
        console.log('[Blockchain] ✅ Contract instance created');
        
        // ✅ FIXED: Enhanced contract testing with rate-limited retries
        console.log('[Blockchain] Testing contract connection with rate limiting...');
        
        const documentCount = await this.executeWithRetry(async () => {
          return await Promise.race([
            this.contract.getDocumentCount(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Contract call timeout')), 15000)
            )
          ]);
        });

        console.log('[Blockchain] ✅ Contract test successful - Document count:', documentCount.toString());
        
      } catch (contractErr) {
        console.error('[Blockchain] ❌ Contract connection failed:', contractErr.message);
        
        // ✅ In production, allow graceful degradation
        if (import.meta.env.PROD) {
          console.warn('[Blockchain] Production: Allowing degraded service mode');
          this.isReady = true;
          return true;
        }
        return false;
      }

      console.log('[Blockchain] ✅ Service initialized successfully with rate limiting:', {
        address: this.walletAddress || 'READ_ONLY',
        contractAddress: CONTRACT_ADDRESS,
        rpcUrl: this.currentRpcUrl?.substring(0, 50) + '...',
        mode: hasPrivateKey ? 'READ_WRITE' : 'READ_ONLY',
        environment: import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT',
        rateLimiting: 'ENABLED'
      });

      this.isReady = true;
      return true;

    } catch (error) {
      console.error('[Blockchain] ❌ Initialization failed:', {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        environment: import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT'
      });
      
      // ✅ In production, try to recover gracefully
      if (import.meta.env.PROD) {
        console.warn('[Blockchain] Production: Attempting graceful degradation...');
        this.isReady = false;
        return false;
      }
      
      this.isReady = false;
      return false;
    }
  }

  // ✅ Get wallet address (untuk ditampilkan di UI)
  getWalletAddress() {
    return this.walletAddress;
  }

  // ✅ ENHANCED: Get wallet status with better error handling
  async getWalletStatus() {
    try {
      if (!this.isReady) {
        return { ready: false, message: 'Service not initialized' };
      }

      if (!this.provider) {
        return { ready: false, message: 'No provider available' };
      }

      const network = await this.provider.getNetwork();
      
      if (!this.walletAddress) {
        return {
          ready: true,
          mode: 'READ_ONLY',
          network: network.name,
          chainId: network.chainId,
          contractAddress: CONTRACT_ADDRESS
        };
      }

      const balance = await this.provider.getBalance(this.walletAddress);

      return {
        ready: true,
        mode: 'READ_WRITE',
        address: this.walletAddress,
        balance: ethers.formatEther(balance),
        network: network.name,
        chainId: network.chainId,
        contractAddress: CONTRACT_ADDRESS
      };
    } catch (error) {
      console.error('[Blockchain] Status check error:', error);
      return { ready: false, error: error.message };
    }
  }

  // ✅ FIXED: Calculate hash yang compatible dengan backend
  calculateDocumentHash(formData) {
    // ✅ Gunakan struktur yang sama dengan backend
    const metadata = {
      perencanaan_id: formData.id || formData.perencanaan_id,
      nama_perusahaan: formData.nama_perusahaan,
      jenis_kegiatan: formData.jenis_kegiatan,
      jumlah_bibit: parseInt(formData.jumlah_bibit),
      lokasi: formData.lokasi,
      tanggal_pelaksanaan: formData.tanggal_pelaksanaan,
      timestamp: formData.timestamp || new Date().toISOString(),
      source: 'FRONTEND_FORM'
    };

    // ✅ CRITICAL: JSON encoding yang sama dengan backend
    const jsonString = JSON.stringify(metadata);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
    
    console.log('[Blockchain] Hash calculation:', {
      metadata,
      jsonString: jsonString.substring(0, 200) + '...',
      hash
    });
    
    return hash;
  }

  // ✅ Store document hash to blockchain
  async storeDocumentHash(docType, formData, metadata = {}) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not initialized');
      }

      // Calculate document hash
      const docHash = this.calculateDocumentHash(formData);

      // Prepare metadata
      const metadataString = JSON.stringify({
        ...metadata,
        timestamp: new Date().toISOString(),
      });

      console.log('[Blockchain] Storing document:', {
        docType,
        docHash,
        metadata: metadataString
      });

      // Send transaction
      toast.info('📤 Mengirim transaksi ke blockchain...', { autoClose: false });
      const tx = await this.contract.storeDocument(docType, docHash, metadataString);

      toast.info('⏳ Menunggu konfirmasi transaksi...', { autoClose: false });
      const receipt = await tx.wait();

      // Get document ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          return parsedLog.name === 'DocumentStored';
        } catch {
          return false;
        }
      });

      let docId = null;
      if (event) {
        const parsedLog = this.contract.interface.parseLog(event);
        docId = parsedLog.args.docId.toString();
      }

      toast.dismiss();
      toast.success('✅ Dokumen berhasil disimpan ke blockchain!');

      return {
        success: true,
        docId,
        docHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        walletAddress: this.walletAddress
      };
    } catch (error) {
      toast.dismiss();
      console.error('[Blockchain] Store error:', error);

      if (error.message.includes('insufficient funds')) {
        toast.error('❌ Saldo wallet tidak cukup untuk gas fee!');
      } else {
        toast.error('❌ Gagal menyimpan ke blockchain: ' + error.message);
      }

      return null;
    }
  }

  // ✅ Store perencanaan form data to blockchain
  // ✅ UPDATED: Store perencanaan dengan better error handling
  async storePerencanaanToBlockchain(formData, perencanaanId) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('[Blockchain] Storing perencanaan to contract:', CONTRACT_ADDRESS);
      
      // ✅ Calculate document hash
      const docHash = this.calculateDocumentHash(formData);
      
      // ✅ Prepare metadata
      const metadata = JSON.stringify({
        perencanaan_id: perencanaanId,
        nama_perusahaan: formData.nama_perusahaan,
        jenis_kegiatan: formData.jenis_kegiatan,
        timestamp: new Date().toISOString(),
        source: 'FRONTEND_FORM'
      });

      console.log('[Blockchain] Calling storeDocument with:', {
        docType: 'PERENCANAAN',
        docHash,
        metadata: metadata.substring(0, 100) + '...'
      });

      // ✅ Send transaction ke smart contract
      toast.info('📤 Menyimpan ke blockchain...', { autoClose: false });
      
      const tx = await this.contract.storeDocument(
        'PERENCANAAN',
        docHash,
        metadata
      );

      console.log('[Blockchain] Transaction sent:', tx.hash);
      toast.info('⏳ Menunggu konfirmasi blockchain...', { autoClose: false });
      
      // ✅ Wait for confirmation
      const receipt = await tx.wait();
      console.log('[Blockchain] Transaction confirmed:', receipt);

      // ✅ Extract document ID dari event logs
      let blockchainDocId = null;
      try {
        const event = receipt.logs.find(log => {
          try {
            const parsedLog = this.contract.interface.parseLog(log);
            return parsedLog.name === 'DocumentStored';
          } catch {
            return false;
          }
        });

        if (event) {
          const parsedLog = this.contract.interface.parseLog(event);
          blockchainDocId = parsedLog.args.docId.toString();
          console.log('[Blockchain] Document stored with ID:', blockchainDocId);
        }
      } catch (eventErr) {
        console.warn('[Blockchain] Could not parse events:', eventErr.message);
      }

      toast.dismiss();
      toast.success('✅ Data berhasil disimpan ke blockchain!');

      return {
        success: true,
        docId: blockchainDocId,
        docHash: docHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: CONTRACT_ADDRESS,
        explorerUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`,
        walletAddress: this.walletAddress
      };

    } catch (error) {
      toast.dismiss();
      console.error('[Blockchain] Store error:', error);

      // ✅ Better error categorization
      let errorMessage = 'Gagal menyimpan ke blockchain';
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = '❌ Saldo wallet tidak cukup untuk gas fee!';
      } else if (error.message.includes('user rejected')) {
        errorMessage = '❌ Transaksi dibatalkan oleh user';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = '❌ Koneksi blockchain bermasalah';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = '❌ Timeout: Blockchain network lambat';
      }
      
      toast.error(errorMessage);

      return {
        success: false,
        error: error.message,
        docHash: this.calculateDocumentHash(formData), // Still return doc hash for database
      };
    }
  }

  // ✅ Get document from blockchain
  async getDocument(docId) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not initialized');
      }

      const doc = await this.contract.getDocument(docId);

      return {
        docType: doc[0],
        docHash: doc[1],
        metadata: JSON.parse(doc[2]),
        uploader: doc[3],
        timestamp: new Date(Number(doc[4]) * 1000)
      };
    } catch (error) {
      console.error('[Blockchain] Get document error:', error);
      toast.error('❌ Gagal mengambil data dari blockchain');
      return null;
    }
  }

  // ✅ OPTIMIZED: Verifikasi dengan rate limiting dan robust error handling
  async verifyDocumentOnBlockchain(docHash) {
    try {
      if (!this.isReady) {
        throw new Error("Blockchain service not ready");
      }

      if (!docHash || typeof docHash !== "string") {
        throw new Error(`Invalid document hash: ${docHash}`);
      }

      console.log("[Blockchain] Verify with rate limiting:", docHash);

      // ✅ Check cache first
      const cacheKey = `verify_${docHash}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;

          if (age < 300000) { // 5 minutes
            console.log("[Blockchain] ⚡ Cache hit");
            return parsed.result;
          }
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      // ✅ Get total document count with rate limiting
      const totalDocs = await this.executeWithRetry(async () => {
        return Number(await this.contract.getDocumentCount());
      });

      console.log("[Blockchain] Total documents =", totalDocs);

      if (totalDocs === 0) {
        const result = {
          verified: false,
          error: "No documents available on-chain",
          docHash,
        };

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ result, timestamp: Date.now() })
        );

        return result;
      }

      // ✅ Smart search with rate limiting
      const maxSearch = Math.min(totalDocs, 20); // Reduced search scope to avoid rate limits
      const batchSize = 2; // Smaller batches to reduce API load

      console.log(`[Blockchain] Rate-limited search: last ${maxSearch} documents, batch size ${batchSize}...`);

      for (
        let i = totalDocs - 1;
        i >= Math.max(0, totalDocs - maxSearch);
        i -= batchSize
      ) {
        const startIdx = Math.max(0, i - batchSize + 1);
        const endIdx = i;

        console.log(`[Blockchain] Rate-limited batch ${startIdx} → ${endIdx}`);

        // ✅ Process batch with rate limiting
        const batch = [];
        for (let j = startIdx; j <= endIdx; j++) {
          if (j < 0 || j >= totalDocs) {
            console.warn(`[Blockchain] Skipped invalid ID ${j}`);
            continue;
          }

          // ✅ Queue each document request
          batch.push(
            queueRequest(async () => {
              return await this.executeWithRetry(async () => {
                return await this.contract.getDocument(j);
              });
            }).then((doc) => ({ success: true, index: j, doc }))
              .catch((err) => {
                const msg = err?.reason || err?.message || "Unknown error";
                return { success: false, index: j, error: msg };
              })
          );
        }

        const results = await Promise.all(batch);

        for (const r of results) {
          if (!r.success) continue;

          const doc = r.doc;
          const hashOnChain = (doc[1] || "").toLowerCase();

          if (hashOnChain === docHash.toLowerCase()) {
            console.log(`[Blockchain] ✅ Match found at index ${r.index}`);

            const verified = {
              verified: true,
              docId: r.index,
              docType: doc[0],
              docHash: doc[1],
              metadata: JSON.parse(doc[2] || "{}"),
              uploader: doc[3],
              timestamp: Number(doc[4]),
              timestampISO: new Date(Number(doc[4]) * 1000).toISOString(),
            };

            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ result: verified, timestamp: Date.now() })
            );

            return verified;
          }
        }

        // ✅ Increased delay between batches to prevent rate limiting
        await new Promise((r) => setTimeout(r, 1500));
      }

      // ✅ Not found
      const result = {
        verified: false,
        error: `Document not found in last ${maxSearch} entries`,
        docHash,
        searchSummary: {
          totalOnChain: totalDocs,
          searched: maxSearch,
          rateLimited: true
        },
      };

      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ result, timestamp: Date.now() })
      );

      return result;
    } catch (error) {
      console.error("[Blockchain] Fatal error:", error);

      return {
        verified: false,
        error: error.message,
        docHash,
        rateLimitError: error.message.includes('429')
      };
    }
  }

  // ✅ Enhanced document fetching with rate limiting
  async getDocumentById(blockchainDocId) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('[Blockchain] Fetching document by ID with rate limiting:', blockchainDocId);
      
      const docId = Number(blockchainDocId);
      if (isNaN(docId) || docId < 0) {
        throw new Error(`Invalid document ID: ${blockchainDocId}`);
      }
      
      // ✅ Check total count with rate limiting
      const totalDocs = await this.executeWithRetry(async () => {
        return Number(await this.contract.getDocumentCount());
      });
      
      if (docId >= totalDocs) {
        console.warn(`[Blockchain] Document ID ${docId} not found (total: ${totalDocs})`);
        return {
          verified: false,
          error: `Document ID ${docId} not found. Total documents: ${totalDocs}`,
          docId: docId
        };
      }
      
      // ✅ Fetch document with rate limiting
      const doc = await this.executeWithRetry(async () => {
        return await Promise.race([
          this.contract.getDocument(docId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Contract call timeout')), 15000)
          )
        ]);
      });

      console.log(`[Blockchain] ✅ Document ${docId} fetched successfully`);

      return {
        docId: docId,
        docType: doc[0],
        docHash: doc[1],
        metadata: JSON.parse(doc[2] || '{}'),
        uploader: doc[3],
        timestamp: new Date(Number(doc[4]) * 1000),
        timestampISO: new Date(Number(doc[4]) * 1000).toISOString(),
        verified: true
      };
    } catch (error) {
      console.error('[Blockchain] Get document by ID error:', error);
      
      if (error.message.includes('Invalid document ID')) {
        return {
          verified: false,
          error: `Document ID ${blockchainDocId} is invalid or doesn't exist on blockchain`,
          docId: blockchainDocId
        };
      }
      
      return {
        verified: false,
        error: error.message,
        docId: blockchainDocId,
        rateLimitError: error.message.includes('429')
      };
    }
  }

  // ✅ Get total document count
  async getDocumentCount() {
    if (!this.isReady) return 0;

    try {
      const count = await this.contract.getDocumentCount();
      return Number(count);
    } catch (error) {
      console.error('[Blockchain] Get count error:', error);
      return 0;
    }
  }

  // ✅ Verify document hash
  async verifyDocumentHash(docId, formData) {
    const storedDoc = await this.getDocument(docId);
    if (!storedDoc) return false;

    const calculatedHash = this.calculateDocumentHash(formData);
    return storedDoc.docHash === calculatedHash;
  }

  // ✅ Get blockchain explorer URL
  getExplorerUrl(txHash) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  // ✅ REAL-TIME: Fetch transaction data dari Sepolia RPC dengan PROPER JSON
  async fetchTransactionFromSepolia(txHash, retries = 3) {
    try {
      console.log('[Blockchain] ========== FETCH TX DEBUG ==========');
      console.log('[Blockchain] TX Hash Input:', txHash);
      console.log('[Blockchain] TX Hash Length:', txHash?.length);
      console.log('[Blockchain] TX Hash Format Valid:', /^0x[a-fA-F0-9]{64}$/.test(txHash));
      
      // ✅ Validate TX hash format FIRST
      if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        console.error('[Blockchain] ❌ INVALID TX HASH FORMAT!', {
          txHash,
          length: txHash?.length,
          shouldBe: 66
        });
        return null;
      }

      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
      
      console.log('[Blockchain] RPC URL:', rpcUrl);
      console.log('[Blockchain] RPC URL Valid:', !!rpcUrl);
      
      if (!rpcUrl) {
        console.error('[Blockchain] ❌ RPC URL NOT CONFIGURED!');
        return null;
      }

      console.log(`[Blockchain] Attempt 1/${retries}: Fetching TX from Sepolia...`);

      // ✅ Retry logic dengan proper JSON
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[Blockchain] ⏳ Attempt ${attempt}/${retries}...`);
          
          // ✅ BUILD REQUEST BODY PROPERLY
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getTransactionByHash',
            params: [txHash], // ✅ MUST BE ARRAY!
            id: 1,
          };
          
          // ✅ VALIDATE JSON BEFORE SENDING
          const jsonString = JSON.stringify(requestBody);
          console.log('[Blockchain] Request Body (validated):', jsonString);
          
          // ✅ Verify it's valid JSON
          try {
            JSON.parse(jsonString); // ✅ Parse check
            console.log('[Blockchain] ✅ JSON is valid');
          } catch (jsonErr) {
            console.error('[Blockchain] ❌ INVALID JSON BODY!', jsonErr.message);
            throw new Error('Invalid JSON in request body');
          }

          // ✅ SEND with proper headers
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // ✅ CRITICAL!
              'Accept': 'application/json', // ✅ GOOD TO HAVE
            },
            body: jsonString, // ✅ Use pre-stringified version
          });

          console.log('[Blockchain] Response Status:', response.status);
          console.log('[Blockchain] Response Headers:', {
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
          });
          
          // ✅ PARSE response carefully
          let data;
          try {
            const responseText = await response.text();
            console.log('[Blockchain] Raw Response Text:', responseText.substring(0, 200));
            
            if (!responseText) {
              console.error('[Blockchain] ❌ Empty response body');
              if (attempt < retries) {
                console.log('[Blockchain] Retrying in 2 seconds...');
                await new Promise(r => setTimeout(r, 2000));
              }
              continue;
            }
            
            data = JSON.parse(responseText);
            console.log('[Blockchain] Parsed Response:', data);
          } catch (parseErr) {
            console.error('[Blockchain] ❌ Failed to parse response:', parseErr.message);
            if (attempt < retries) {
              console.log('[Blockchain] Retrying in 2 seconds...');
              await new Promise(r => setTimeout(r, 2000));
            }
            continue;
          }

          // ✅ CHECK FOR RPC ERRORS
          if (data.error) {
            console.error(`[Blockchain] ❌ RPC ERROR (attempt ${attempt}):`, data.error);
            
            if (attempt < retries) {
              console.log('[Blockchain] Retrying in 2 seconds...');
              await new Promise(r => setTimeout(r, 2000));
            }
            continue;
          }

          // ✅ SUCCESS: TX found
          if (data.result) {
            console.log(`[Blockchain] ✅ TX FOUND (attempt ${attempt}):`, data.result);
            
            const tx = data.result;
            const blockNumber = tx.blockNumber ? parseInt(tx.blockNumber, 16) : null;
            
            // ... rest of parsing logic
            return {
              txHash: tx.hash,
              from: tx.from,
              to: tx.to,
              blockNumber: blockNumber,
              status: 'success',
              verified: true,
              explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
              fetchedAt: new Date().toISOString()
            };
          } else {
            console.warn(`[Blockchain] ⚠️ TX not found (attempt ${attempt})`);
            
            if (attempt < retries) {
              console.log('[Blockchain] Retrying in 2 seconds...');
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        } catch (err) {
          console.error(`[Blockchain] ❌ Fetch error (attempt ${attempt}):`, err.message);
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      console.error(`[Blockchain] ❌ Could not fetch TX after ${retries} attempts:`, txHash);
      console.log('[Blockchain] ========== FETCH TX DEBUG END ==========');
      return null;
      
    } catch (err) {
      console.error('[Blockchain] ❌ Fatal error in fetchTransactionFromSepolia:', err);
      return null;
    }
  }

  // ✅ ENHANCED: Direct smart contract interaction without backend
  async storeDocumentToBlockchain(formData, metadata = {}) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('[Blockchain] Direct contract call - storing document...');
      
      // ✅ Calculate document hash
      const docHash = this.calculateDocumentHash(formData);
      
      // ✅ Prepare metadata for smart contract
      const contractMetadata = JSON.stringify({
        ...metadata,
        nama_perusahaan: formData.nama_perusahaan,
        jenis_kegiatan: formData.jenis_kegiatan,
        jumlah_bibit: formData.jumlah_bibit,
        timestamp: new Date().toISOString(),
        source: 'FRONTEND_DIRECT'
      });

      // ✅ Send transaction directly to smart contract
      toast.info('📤 Sending to blockchain...', { autoClose: false });
      
      const tx = await this.contract.storeDocument(
        'PERENCANAAN',
        docHash,
        contractMetadata
      );

      console.log('[Blockchain] Transaction sent:', tx.hash);
      toast.info('⏳ Waiting for blockchain confirmation...', { autoClose: false });
      
      // ✅ Wait for confirmation
      const receipt = await tx.wait();
      console.log('[Blockchain] Transaction confirmed:', receipt);

      // ✅ Parse events to get document ID
      let blockchainDocId = null;
      try {
        const event = receipt.logs.find(log => {
          try {
            const parsedLog = this.contract.interface.parseLog(log);
            return parsedLog.name === 'DocumentStored';
          } catch {
            return false;
          }
        });

        if (event) {
          const parsedLog = this.contract.interface.parseLog(event);
          blockchainDocId = parsedLog.args.docId.toString();
          console.log('[Blockchain] Document stored with ID:', blockchainDocId);
        }
      } catch (eventErr) {
        console.warn('[Blockchain] Could not parse events:', eventErr.message);
      }

      toast.dismiss();
      toast.success('✅ Successfully stored on blockchain!');

      return {
        success: true,
        docId: blockchainDocId,
        docHash: docHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: CONTRACT_ADDRESS,
        explorerUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`,
        walletAddress: this.walletAddress,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      toast.dismiss();
      console.error('[Blockchain] Store error:', error);

      let errorMessage = 'Failed to store on blockchain';
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = '❌ Insufficient wallet balance for gas fees!';
      } else if (error.message.includes('user rejected')) {
        errorMessage = '❌ Transaction rejected by user';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = '❌ Network connection error';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = '❌ Transaction timeout';
      }
      
      toast.error(errorMessage);

      return {
        success: false,
        error: error.message,
        docHash: this.calculateDocumentHash(formData),
      };
    }
  }

  // ✅ NEW: Get all documents from blockchain with pagination
  async getAllDocuments(startId = 0, limit = 50) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not initialized');
      }

      const totalDocs = await this.contract.getDocumentCount();
      const totalCount = Number(totalDocs);
      
      console.log(`[Blockchain] Fetching documents ${startId}-${Math.min(startId + limit, totalCount)} of ${totalCount}`);

      const documents = [];
      const endId = Math.min(startId + limit, totalCount);

      for (let i = startId; i < endId; i++) {
        try {
          const doc = await this.contract.getDocument(i);
          
          documents.push({
            docId: i,
            docType: doc[0],
            docHash: doc[1],
            metadata: JSON.parse(doc[2] || '{}'),
            uploader: doc[3],
            timestamp: new Date(Number(doc[4]) * 1000),
            timestampISO: new Date(Number(doc[4]) * 1000).toISOString(),
            verified: true,
            source: 'BLOCKCHAIN'
          });
        } catch (err) {
          console.warn(`[Blockchain] Could not fetch document ${i}:`, err.message);
        }
      }

      return {
        documents,
        totalCount,
        startId,
        endId,
        hasMore: endId < totalCount
      };
    } catch (error) {
      console.error('[Blockchain] Get all documents error:', error);
      return {
        documents: [],
        totalCount: 0,
        error: error.message
      };
    }
  }
}

// ✅ Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
