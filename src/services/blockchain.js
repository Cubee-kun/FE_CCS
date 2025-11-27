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

// ✅ RPC URL dari environment - PERBAIKI INI
const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// ✅ Private Key dari environment - PERBAIKI INI
const PRIVATE_KEY = import.meta.env.VITE_WALLET_PRIVATE_KEY || "";

// ✅ Contract Address dari environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5C5F6CE61647600bB8c04F59c0F2B493EBE78DDF";

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
    this.isReady = false;
  }

  // ✅ Initialize blockchain service
  async initialize() {
    try {
      if (this.isReady) {
        console.log('[Blockchain] Service already initialized');
        return true;
      }

      // ✅ STEP 1: Validate Contract Address Format
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.error('[Blockchain] ❌ CONTRACT ADDRESS INVALID:', {
          value: CONTRACT_ADDRESS,
          error: 'Contract not configured or is zero address',
          solution: [
            '1. Deploy contract to Remix (https://remix.ethereum.org)',
            '2. Copy contract address after deployment',
            '3. Set VITE_CONTRACT_ADDRESS in .env',
            '4. Restart dev server (Ctrl+C then npm run dev)'
          ]
        });
        return false;
      }

      // ✅ Validate address format (must be 42 chars starting with 0x)
      if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
        console.error('[Blockchain] ❌ CONTRACT ADDRESS FORMAT INVALID:', {
          value: CONTRACT_ADDRESS,
          expected: '0x + 40 hex characters',
          length: CONTRACT_ADDRESS.length
        });
        return false;
      }

      // ✅ STEP 2: Validate Private Key
      if (!PRIVATE_KEY || PRIVATE_KEY.trim() === "") {
        console.error('[Blockchain] ❌ PRIVATE KEY NOT SET');
        return false;
      }

      // ✅ Validate private key format (64 hex chars, optionally with 0x prefix)
      const cleanKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
      if (!/^0x[a-fA-F0-9]{64}$/.test(cleanKey)) {
        console.error('[Blockchain] ❌ PRIVATE KEY FORMAT INVALID:', {
          error: 'Must be 64 hex characters (or 66 with 0x prefix)',
          length: cleanKey.length
        });
        return false;
      }

      // ✅ STEP 3: Validate RPC URL
      if (!RPC_URL) {
        console.error('[Blockchain] ❌ RPC URL NOT CONFIGURED');
        return false;
      }

      // ✅ STEP 4: Test RPC Connection
      console.log('[Blockchain] Testing RPC connection...');
      try {
        const testResponse = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        });

        const testData = await testResponse.json();
        
        if (testData.error) {
          throw new Error(`RPC Error: ${testData.error.message}`);
        }
        
        if (testData.result) {
          const blockNumber = parseInt(testData.result, 16);
          console.log('[Blockchain] ✅ RPC Connection OK - Block:', blockNumber);
        } else {
          throw new Error('No result from RPC');
        }
      } catch (rpcErr) {
        console.error('[Blockchain] ❌ RPC Connection Failed:', rpcErr.message);
        return false;
      }

      // ✅ STEP 5: Create provider
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      console.log('[Blockchain] ✅ Provider created');

      // ✅ STEP 6: Create wallet
      try {
        const wallet = new ethers.Wallet(cleanKey, this.provider);
        this.signer = wallet;
        this.walletAddress = wallet.address;
        console.log('[Blockchain] ✅ Wallet created:', this.walletAddress);
      } catch (walletErr) {
        console.error('[Blockchain] ❌ Wallet creation failed:', walletErr.message);
        return false;
      }

      // ✅ STEP 7: Connect to contract with validation
      try {
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
        console.log('[Blockchain] ✅ Contract instance created');
        
        // ✅ TEST: Call getDocumentCount to validate contract
        console.log('[Blockchain] Testing contract connection with getDocumentCount()...');
        
        let documentCount;
        try {
          documentCount = await this.contract.getDocumentCount();
          console.log('[Blockchain] ✅ Contract test successful - Document count:', documentCount.toString());
        } catch (contractErr) {
          console.error('[Blockchain] ❌ CONTRACT TEST FAILED:', {
            error: contractErr.message,
            code: contractErr.code,
            method: 'getDocumentCount',
            solutions: [
              '1. Check if contract is deployed to Sepolia',
              '2. Verify CONTRACT_ADDRESS matches deployed contract',
              '3. Verify CONTRACT_ABI matches deployed contract functions',
              '4. Check if wallet has balance for gas (even for read-only calls)',
              '5. Redeploy contract and update VITE_CONTRACT_ADDRESS'
            ]
          });
          throw contractErr;
        }
      } catch (contractErr) {
        console.error('[Blockchain] ❌ Contract connection failed:', contractErr.message);
        return false;
      }

      // ✅ STEP 8: Get network info
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.walletAddress);

      console.log('[Blockchain] ✅ Service initialized successfully:', {
        address: this.walletAddress,
        network: network.name,
        chainId: network.chainId,
        balance: ethers.formatEther(balance),
        contractAddress: CONTRACT_ADDRESS,
        rpcUrl: RPC_URL.substring(0, 50) + '...'
      });

      this.isReady = true;
      return true;

    } catch (error) {
      console.error('[Blockchain] ❌ Initialization failed:', error.message);
      this.isReady = false;
      return false;
    }
  }

  // ✅ Get wallet address (untuk ditampilkan di UI)
  getWalletAddress() {
    return this.walletAddress;
  }

  // ✅ Get wallet status
  async getWalletStatus() {
    try {
      if (!this.isReady || !this.provider) {
        return { ready: false, message: 'Service not initialized' };
      }

      const balance = await this.provider.getBalance(this.walletAddress);
      const network = await this.provider.getNetwork();

      return {
        ready: true,
        address: this.walletAddress,
        balance: ethers.formatEther(balance),
        network: network.name,
        chainId: network.chainId
      };
    } catch (error) {
      console.error('[Blockchain] Status check error:', error);
      return { ready: false, error: error.message };
    }
  }

  // ✅ Calculate hash from form data
  calculateDocumentHash(formData) {
    const dataString = JSON.stringify(formData, Object.keys(formData).sort());
    const hash = ethers.keccak256(ethers.toUtf8Bytes(dataString));
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

  // ✅ Get document by blockchain document ID
  async getDocumentById(blockchainDocId) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('[Blockchain] Fetching document by ID:', blockchainDocId);
      
      const doc = await this.contract.getDocument(blockchainDocId);

      return {
        docId: blockchainDocId,
        docType: doc[0],
        docHash: doc[1],
        metadata: JSON.parse(doc[2] || '{}'),
        uploader: doc[3],
        timestamp: new Date(Number(doc[4]) * 1000),
        verified: true
      };
    } catch (error) {
      console.error('[Blockchain] Get document error:', error);
      return null;
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

  // ✅ ENHANCED: Verify document on blockchain dengan better error handling & skip invalid IDs
  async verifyDocumentOnBlockchain(docHash) {
    try {
      if (!this.isReady) {
        throw new Error('Blockchain service not ready. Call initialize() first.');
      }

      if (!docHash || typeof docHash !== 'string') {
        throw new Error(`Invalid document hash: ${docHash}`);
      }

      console.log('[Blockchain] Verifying document hash:', docHash);

      // ✅ Get total count dengan error handling
      let totalDocs;
      try {
        totalDocs = await this.contract.getDocumentCount();
        totalDocs = Number(totalDocs);
        console.log(`[Blockchain] Found ${totalDocs} total documents on chain`);
        
        if (totalDocs === 0) {
          console.warn('[Blockchain] ⚠️ No documents stored on blockchain yet');
          return {
            verified: false,
            error: 'No documents found on blockchain',
            docHash
          };
        }
      } catch (countErr) {
        console.error('[Blockchain] ❌ Failed to get document count:', {
          error: countErr.message,
          code: countErr.code
        });
        
        // ✅ Provide helpful debugging info
        if (countErr.code === 'BAD_DATA') {
          console.error('[Blockchain] 🔴 CONTRACT ERROR - Likely causes:');
          console.error('  - Contract address is wrong');
          console.error('  - Contract is not deployed to this network');
          console.error('  - Contract ABI does not match deployed contract');
        }
        
        throw countErr;
      }

      // ✅ IMPROVED: Search through documents with error handling
      console.log(`[Blockchain] Searching through ${totalDocs} documents...`);
      const failedIds = [];
      const errors = [];

      for (let i = 0; i < totalDocs; i++) {
        try {
          const doc = await this.contract.getDocument(i);
          
          // ✅ Validate document object
          if (!doc || !doc[1]) {
            console.warn(`[Blockchain] Document ${i} returned empty/invalid data, skipping...`);
            failedIds.push(i);
            continue;
          }
          
          // ✅ Compare hash
          if (doc[1].toLowerCase() === docHash.toLowerCase()) {
            console.log(`[Blockchain] ✅ Document found at index ${i}!`);
            
            return {
              verified: true,
              docId: i,
              docType: doc[0],
              docHash: doc[1],
              metadata: JSON.parse(doc[2] || '{}'),
              uploader: doc[3],
              timestamp: Number(doc[4]),
              timestampISO: new Date(Number(doc[4]) * 1000).toISOString(),
              blockchainProof: true
            };
          }
        } catch (docErr) {
          // ✅ Log error but continue searching
          const errorMsg = docErr.message || String(docErr);
          
          if (errorMsg.includes('Invalid document ID')) {
            console.warn(`[Blockchain] ⏭️ Document ${i}: Invalid ID (contract says this ID doesn't exist), skipping...`);
            failedIds.push(i);
          } else if (errorMsg.includes('reverted')) {
            console.warn(`[Blockchain] ⏭️ Document ${i}: Contract reverted, skipping... (${errorMsg.substring(0, 50)})`);
            failedIds.push(i);
          } else {
            console.warn(`[Blockchain] ⚠️ Error reading document ${i}:`, errorMsg.substring(0, 100));
            errors.push({ id: i, error: errorMsg });
          }
          
          // Continue searching other documents
          continue;
        }
      }

      // ✅ Summary if search completed without finding document
      console.log('[Blockchain] ❌ Document hash not found on blockchain');
      console.log('[Blockchain] Search summary:', {
        totalDocumentsOnChain: totalDocs,
        searchedSuccessfully: totalDocs - failedIds.length,
        skippedInvalidIds: failedIds,
        otherErrors: errors.length
      });
      
      return {
        verified: false,
        error: `Document hash not found in ${totalDocs} documents on blockchain`,
        docHash,
        searchedDocuments: totalDocs,
        searchSummary: {
          totalOnChain: totalDocs,
          searched: totalDocs - failedIds.length,
          failed: failedIds.length,
          invalidIds: failedIds
        }
      };

    } catch (error) {
      console.error('[Blockchain] ❌ Verification error:', {
        message: error.message,
        code: error.code,
        docHash
      });
      
      return {
        verified: false,
        error: error.message,
        code: error.code,
        docHash
      };
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;
