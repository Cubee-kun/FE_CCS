import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// ✅ Smart Contract ABI untuk menyimpan dokumen hash
const CONTRACT_ABI = [
  "function storeDocument(string memory _docType, string memory _docHash, string memory _metadata) public returns (uint256)",
  "function getDocument(uint256 _docId) public view returns (string memory docType, string memory docHash, string memory metadata, address uploader, uint256 timestamp)",
  "function getDocumentCount() public view returns (uint256)",
  "event DocumentStored(uint256 indexed docId, string docType, string docHash, address indexed uploader, uint256 timestamp)"
];

// ✅ RPC URL dari environment - PERBAIKI INI
const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// ✅ Private Key dari environment - PERBAIKI INI
const PRIVATE_KEY = import.meta.env.VITE_WALLET_PRIVATE_KEY || "";

// ✅ Contract Address dari environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

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

      // ✅ STEP 1: Validasi Contract Address
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.error('[Blockchain] ❌ CONFIGURATION ERROR:', {
          issue: 'Contract address not configured',
          VITE_CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS,
          solution: 'Paste deployed contract address di .env VITE_CONTRACT_ADDRESS',
          steps: [
            '1. Deploy contract ke Remix (https://remix.ethereum.org)',
            '2. Copy contract address setelah deploy',
            '3. Paste ke .env file sebagai VITE_CONTRACT_ADDRESS',
            '4. Restart dev server (Ctrl+C then npm run dev)'
          ]
        });
        return false;
      }

      // ✅ STEP 2: Validasi Private Key - INI YANG ERROR ANDA
      if (!PRIVATE_KEY || PRIVATE_KEY.trim() === "") {
        console.error('[Blockchain] ❌ CONFIGURATION ERROR:', {
          issue: 'Private key not configured',
          found: {
            VITE_WALLET_PRIVATE_KEY: import.meta.env.VITE_WALLET_PRIVATE_KEY ? '✅ SET' : '❌ NOT SET',
            VITE_SEPOLIA_RPC_URL: import.meta.env.VITE_SEPOLIA_RPC_URL ? '✅ SET' : '❌ NOT SET',
            VITE_CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS ? '✅ SET' : '❌ NOT SET',
          },
          solution: 'Pastikan .env sudah benar diisi',
          steps: [
            '1. Buka file .env di root project',
            '2. Isi VITE_WALLET_PRIVATE_KEY=your_private_key',
            '3. Isi VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY',
            '4. Isi VITE_CONTRACT_ADDRESS=0x...',
            '5. Restart dev server (Ctrl+C lalu npm run dev)',
            '6. Check browser console untuk verifikasi'
          ],
          currentValues: {
            VITE_WALLET_PRIVATE_KEY: import.meta.env.VITE_WALLET_PRIVATE_KEY || '(not set)',
            VITE_SEPOLIA_RPC_URL: import.meta.env.VITE_SEPOLIA_RPC_URL || '(not set)',
            VITE_CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '(not set)',
          },
          warning: '⚠️ JANGAN pernah share private key ke siapapun!'
        });
        return false;
      }

      // ✅ STEP 3: Validasi RPC URL
      if (!RPC_URL) {
        console.error('[Blockchain] ❌ RPC URL not configured');
        return false;
      }

      // ✅ TEST RPC CONNECTION PERTAMA KALI
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
        
        if (testData.result) {
          const blockNumber = parseInt(testData.result, 16);
          console.log('[Blockchain] ✅ RPC Connection successful!', {
            blockNumber: blockNumber,
            blockHex: testData.result,
            rpcUrl: RPC_URL.substring(0, 50) + '...',
          });
        } else if (testData.error) {
          throw new Error(`RPC Error: ${testData.error.message}`);
        }
      } catch (rpcTestErr) {
        console.error('[Blockchain] ❌ RPC Connection Failed:', {
          error: rpcTestErr.message,
          rpcUrl: RPC_URL,
          possibleCauses: [
            'Invalid RPC URL',
            'Network unreachable',
            'CORS issues',
            'API Key invalid/rate limited'
          ]
        });
        return false;
      }

      // ✅ Create provider dengan RPC URL
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      console.log('[Blockchain] ✅ Provider created');

      // ✅ Create wallet dari private key
      const wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
      this.signer = wallet;
      this.walletAddress = wallet.address;
      console.log('[Blockchain] ✅ Wallet created from private key');

      // ✅ Connect to contract
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      console.log('[Blockchain] ✅ Contract connected');

      // ✅ Test connection
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.walletAddress);

      console.log('[Blockchain] ✅ Service initialized successfully:', {
        address: this.walletAddress,
        network: network.name,
        chainId: network.chainId,
        balance: ethers.formatEther(balance),
        contractAddress: CONTRACT_ADDRESS
      });

      this.isReady = true;
      return true;
    } catch (error) {
      console.error('[Blockchain] ❌ Initialization error:', error.message);
      console.error('[Blockchain] Full error:', error);
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
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;
