import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// ✅ Smart Contract ABI untuk menyimpan dokumen hash
const CONTRACT_ABI = [
  "function storeDocument(string memory _docType, string memory _docHash, string memory _metadata) public returns (uint256)",
  "function getDocument(uint256 _docId) public view returns (string memory docType, string memory docHash, string memory metadata, address uploader, uint256 timestamp)",
  "function getDocumentCount() public view returns (uint256)",
  "event DocumentStored(uint256 indexed docId, string docType, string docHash, address indexed uploader, uint256 timestamp)"
];

// ✅ Contract Address dari environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// ✅ Private Key dari environment - PENTING: Harus ada!
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || "";

// ✅ RPC URL dari environment
const RPC_URL = import.meta.env.VITE_SEPOLIA_URL || "https://ethereum-sepolia-rpc.publicnode.com";

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
          VITE_PRIVATE_KEY: import.meta.env.VITE_PRIVATE_KEY || '(not set)',
          solution: 'Tambahkan private key Anda ke .env VITE_PRIVATE_KEY',
          steps: [
            '1. Buka MetaMask di browser',
            '2. Klik Account menu (3 titik di kanan atas)',
            '3. Pilih "Account details"',
            '4. Klik "Show private key"',
            '5. Masukkan password MetaMask Anda',
            '6. Copy private key (tanpa 0x di depan)',
            '7. Paste ke .env sebagai VITE_PRIVATE_KEY=...',
            '8. Restart dev server'
          ],
          warning: '⚠️ JANGAN pernah share private key ke siapapun!',
          security: 'Private key memberikan akses penuh ke wallet Anda'
        });
        return false;
      }

      // ✅ STEP 3: Validasi RPC URL
      if (!RPC_URL) {
        console.error('[Blockchain] ❌ RPC URL not configured');
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
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;
