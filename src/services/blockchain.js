import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// ✅ Smart Contract ABI untuk menyimpan dokumen hash
const CONTRACT_ABI = [
  "function storeDocument(string memory _docType, string memory _docHash, string memory _metadata) public returns (uint256)",
  "function getDocument(uint256 _docId) public view returns (string memory docType, string memory docHash, string memory metadata, address uploader, uint256 timestamp)",
  "function getDocumentCount() public view returns (uint256)",
  "event DocumentStored(uint256 indexed docId, string docType, string docHash, address indexed uploader, uint256 timestamp)"
];

// ✅ Contract Address (Deploy your smart contract and paste address here)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// ✅ Wallet privat key dan RPC URL dari environment
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || "";
const RPC_URL = import.meta.env.VITE_SEPOLIA_URL || "https://ethereum-sepolia-rpc.publicnode.com";

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
    this.isReady = false;
  }

  // ✅ Initialize blockchain service (dipanggil sekali saat app start)
  async initialize() {
    try {
      if (this.isReady) {
        console.log('[Blockchain] Service already initialized');
        return true;
      }

      // Check contract address
      if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.error('[Blockchain] Contract address not configured');
        return false;
      }

      // Check private key
      if (!PRIVATE_KEY) {
        console.error('[Blockchain] Private key not configured');
        return false;
      }

      // Create provider
      this.provider = new ethers.JsonRpcProvider(RPC_URL);

      // Create wallet dari private key
      const wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
      this.signer = wallet;
      this.walletAddress = wallet.address;

      // Connect to contract
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

      // Test connection
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.walletAddress);

      console.log('[Blockchain] Service initialized:', {
        address: this.walletAddress,
        network: network.name,
        chainId: network.chainId,
        balance: ethers.formatEther(balance),
        contractAddress: CONTRACT_ADDRESS
      });

      this.isReady = true;
      return true;
    } catch (error) {
      console.error('[Blockchain] Initialization error:', error);
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
