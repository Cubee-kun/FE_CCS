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
const CONTRACT_ADDRESS = "0x..."; // TODO: Replace with your deployed contract address

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  // ✅ Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  // ✅ Connect to MetaMask
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      toast.error('❌ MetaMask tidak terinstall! Silakan install MetaMask terlebih dahulu.');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();
      
      // Connect to contract
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      
      // Get network info
      const network = await this.provider.getNetwork();
      
      console.log('[Blockchain] Connected:', {
        account: this.account,
        network: network.name,
        chainId: network.chainId
      });
      
      toast.success(`✅ Wallet terhubung: ${this.account.slice(0, 6)}...${this.account.slice(-4)}`);
      
      return {
        account: this.account,
        network: network.name,
        chainId: network.chainId
      };
    } catch (error) {
      console.error('[Blockchain] Connection error:', error);
      toast.error('❌ Gagal terhubung ke MetaMask!');
      return null;
    }
  }

  // ✅ Disconnect wallet
  disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    toast.info('Wallet terputus');
  }

  // ✅ Get current account
  getCurrentAccount() {
    return this.account;
  }

  // ✅ Calculate hash from form data
  calculateDocumentHash(formData) {
    const dataString = JSON.stringify(formData, Object.keys(formData).sort());
    const hash = ethers.keccak256(ethers.toUtf8Bytes(dataString));
    return hash;
  }

  // ✅ Store document hash to blockchain
  async storeDocumentHash(docType, formData, metadata = {}) {
    if (!this.contract) {
      toast.error('❌ Wallet belum terhubung!');
      return null;
    }

    try {
      // Calculate document hash
      const docHash = this.calculateDocumentHash(formData);
      
      // Prepare metadata
      const metadataString = JSON.stringify({
        ...metadata,
        timestamp: new Date().toISOString(),
        uploader: this.account
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
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      toast.dismiss();
      console.error('[Blockchain] Store error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('❌ Transaksi ditolak oleh user');
      } else {
        toast.error('❌ Gagal menyimpan ke blockchain: ' + error.message);
      }
      
      return null;
    }
  }

  // ✅ Get document from blockchain
  async getDocument(docId) {
    if (!this.contract) {
      toast.error('❌ Wallet belum terhubung!');
      return null;
    }

    try {
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
    if (!this.contract) return 0;
    
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
    // Adjust based on network (mainnet, sepolia, polygon, etc.)
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;
