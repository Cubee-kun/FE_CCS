import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// ✅ Smart Contract ABI untuk menyimpan dokumen hash
const CONTRACT_ABI = [
  "function storeDocument(string memory _docType, string memory _docHash, string memory _metadata) public returns (uint256)",
  "function getDocument(uint256 _docId) public view returns (string memory docType, string memory docHash, string memory metadata, address uploader, uint256 timestamp)",
  "function getDocumentCount() public view returns (uint256)",
  "event DocumentStored(uint256 indexed docId, string docType, string docHash, address indexed uploader, uint256 timestamp)"
];

// ⚠️ PENTING: Ganti dengan contract address yang sudah di-deploy!
// Jika belum deploy contract, ikuti langkah di bawah
const CONTRACT_ADDRESS = "0xC311d3981c4654FF1662fdA4027d9A383f34E2B3"; // ⚠️ REPLACE THIS!

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

  // ✅ Connect to MetaMask dengan error handling lebih detail
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      toast.error('❌ MetaMask tidak terinstall! Silakan install MetaMask terlebih dahulu.');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    try {
      // ✅ Check if contract address is set
      if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        toast.error('❌ Contract address belum dikonfigurasi! Deploy contract terlebih dahulu.');
        console.error('[Blockchain] Contract address not configured');
        return null;
      }

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
      
      // ✅ Verify correct network (Sepolia)
      const chainId = Number(network.chainId);
      if (chainId !== 11155111) {
        toast.error(`❌ Wrong network! Please switch to Sepolia Testnet. Current: ${network.name}`);
        console.error('[Blockchain] Wrong network:', { chainId, expected: 11155111 });
        
        // ✅ Auto-switch to Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
          });
          toast.success('✅ Network switched to Sepolia');
          // Retry connection
          return await this.connectWallet();
        } catch (switchError) {
          console.error('[Blockchain] Failed to switch network:', switchError);
          return null;
        }
      }

      // ✅ Check balance
      const balance = await this.provider.getBalance(this.account);
      const balanceInEth = ethers.formatEther(balance);
      
      console.log('[Blockchain] Connected:', {
        account: this.account,
        network: network.name,
        chainId: chainId,
        balance: `${balanceInEth} ETH`
      });

      if (parseFloat(balanceInEth) < 0.01) {
        toast.warning(`⚠️ Low balance: ${balanceInEth} ETH. You may need more for gas fees.`);
      }
      
      toast.success(`✅ Wallet terhubung: ${this.account.slice(0, 6)}...${this.account.slice(-4)}`);
      toast.info(`💰 Balance: ${parseFloat(balanceInEth).toFixed(4)} ETH`);
      
      return {
        account: this.account,
        network: network.name,
        chainId: chainId,
        balance: balanceInEth
      };
    } catch (error) {
      console.error('[Blockchain] Connection error:', error);
      
      // ✅ Detailed error messages
      if (error.code === 4001) {
        toast.error('❌ User rejected connection request');
      } else if (error.code === -32002) {
        toast.warning('⚠️ Connection request already pending. Check MetaMask.');
      } else {
        toast.error(`❌ Gagal terhubung: ${error.message}`);
      }
      
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

    // ✅ Verify contract address again
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      toast.error('❌ Contract address tidak valid!');
      console.error('[Blockchain] Invalid contract address');
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
        metadata: metadataString,
        contractAddress: CONTRACT_ADDRESS
      });

      // ✅ Estimate gas first
      toast.info('⏳ Estimating gas...', { autoClose: 2000 });
      
      let gasEstimate;
      try {
        gasEstimate = await this.contract.storeDocument.estimateGas(
          docType, 
          docHash, 
          metadataString
        );
        console.log('[Blockchain] Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('[Blockchain] Gas estimation failed:', gasError);
        toast.error(`❌ Gas estimation failed: ${gasError.message}`);
        
        // ✅ Check if it's a contract deployment issue
        if (gasError.message.includes('ENS name not configured')) {
          toast.error('❌ Contract address invalid or not deployed!');
        }
        
        return null;
      }

      // ✅ Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;

      // Send transaction with gas limit
      toast.info('📤 Mengirim transaksi ke blockchain...', { autoClose: false });
      
      const tx = await this.contract.storeDocument(
        docType, 
        docHash, 
        metadataString,
        { gasLimit }
      );
      
      console.log('[Blockchain] Transaction sent:', tx.hash);
      toast.info(`⏳ Menunggu konfirmasi... TX: ${tx.hash.slice(0, 10)}...`, { autoClose: false });
      
      const receipt = await tx.wait();
      
      console.log('[Blockchain] Transaction confirmed:', receipt);
      
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
        effectiveGasPrice: receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, 'gwei') : 'N/A'
      };
    } catch (error) {
      toast.dismiss();
      console.error('[Blockchain] Store error:', error);
      
      // ✅ Detailed error handling
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        toast.error('❌ Transaksi ditolak oleh user');
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
        toast.error('❌ Saldo tidak cukup untuk gas fee!');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        toast.error('❌ Contract error atau address tidak valid!');
        console.error('[Blockchain] Possible issues:', {
          contractAddress: CONTRACT_ADDRESS,
          message: 'Contract may not be deployed or ABI mismatch'
        });
      } else if (error.message?.includes('ENS')) {
        toast.error('❌ Contract address tidak valid!');
      } else {
        toast.error(`❌ Gagal menyimpan ke blockchain: ${error.message}`);
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
