import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const BlockchainContext = createContext();

export function BlockchainProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');

  // ✅ Initialize blockchain dari .env file
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        console.log('[BlockchainContext] Initializing from .env configuration...');
        
        const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
        const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
        const chainId = import.meta.env.VITE_SEPOLIA_CHAIN_ID;
        
        // ✅ Validasi konfigurasi
        if (!privateKey) {
          throw new Error('VITE_WALLET_PRIVATE_KEY tidak ditemukan di .env');
        }
        
        if (!rpcUrl) {
          throw new Error('VITE_SEPOLIA_RPC_URL tidak ditemukan di .env');
        }

        // ✅ Create provider dari RPC URL
        const ethProvider = new ethers.JsonRpcProvider(rpcUrl);
        console.log('[BlockchainContext] ✅ Provider created from RPC');
        
        // ✅ Create wallet dari private key
        const wallet = new ethers.Wallet(privateKey, ethProvider);
        console.log('[BlockchainContext] ✅ Wallet created from private key');
        console.log('[BlockchainContext] Wallet address:', wallet.address);
        
        // ✅ Get account info
        const network = await ethProvider.getNetwork();
        const walletBalance = await ethProvider.getBalance(wallet.address);
        const balanceInEth = ethers.formatEther(walletBalance);
        
        console.log('[BlockchainContext] ✅ Connected to:', {
          network: network.name,
          chainId: Number(network.chainId),
          address: wallet.address,
          balance: balanceInEth,
        });

        setProvider(ethProvider);
        setSigner(wallet);
        setAccount(wallet.address);
        setBalance(balanceInEth);
        setChainId(Number(network.chainId));
        setIsConnected(true);
        setError(null);
        
      } catch (err) {
        console.error('[BlockchainContext] ❌ Initialization error:', err.message);
        setError(err.message);
        setIsConnected(false);
      } finally {
        setIsReady(true);
      }
    };

    // ✅ Small delay untuk memastikan .env sudah load
    const timer = setTimeout(initBlockchain, 500);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Get blockchain status
  const getBlockchainStatus = () => {
    return {
      isConnected,
      isReady,
      account,
      chainId,
      balance,
      error,
    };
  };

  // ✅ Store document hash ke blockchain
  const storeDocumentHash = async (docType, formData, metadata = {}) => {
    try {
      if (!isConnected || !signer) {
        throw new Error('Blockchain service tidak terhubung');
      }

      console.log('[BlockchainContext] Storing document to blockchain...');

      // ✅ Gunakan smart contract untuk menyimpan
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      
      if (!contractAddress) {
        throw new Error('Contract address tidak ditemukan di .env');
      }

      // ✅ Simpan data via API (backend yang akan handle blockchain transaction)
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/blockchain/store-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docType,
          formData,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            walletAddress: account,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API returned ${response.status}`);
      }

      const result = await response.json();

      console.log('[BlockchainContext] ✅ Document stored:', result);

      return {
        success: true,
        docId: result.docId,
        docHash: result.docHash,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
      };
    } catch (error) {
      console.error('[BlockchainContext] Store error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // ✅ Verify document hash
  const verifyDocumentHash = async (docHash) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/blockchain/verify-document?docHash=${docHash}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Verification failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        verified: result.verified,
        docHash: result.docHash,
        txHash: result.txHash,
        timestamp: result.timestamp,
      };
    } catch (error) {
      console.error('[BlockchainContext] Verification error:', error);
      return {
        verified: false,
        error: error.message,
      };
    }
  };

  // ✅ Get explorer URL
  const getExplorerUrl = (txHash) => {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  const value = {
    provider,
    signer,
    account,
    isConnected,
    isReady,
    chainId,
    balance,
    error,
    getBlockchainStatus,
    storeDocumentHash,
    verifyDocumentHash,
    getExplorerUrl,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
}
