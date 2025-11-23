import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const BlockchainContext = createContext();

// ✅ Contract ABI (sesuaikan dengan smart contract Anda)
const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "bytes32", "name": "docHash", "type": "bytes32" }],
    "name": "getDocument",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "nama_perusahaan", "type": "string" },
      { "internalType": "string", "name": "nama_pic", "type": "string" },
      { "internalType": "string", "name": "narahubung", "type": "string" },
      { "internalType": "string", "name": "jenis_kegiatan", "type": "string" },
      { "internalType": "string", "name": "jenis_bibit", "type": "string" },
      { "internalType": "uint256", "name": "jumlah_bibit", "type": "uint256" },
      { "internalType": "string", "name": "lokasi", "type": "string" },
      { "internalType": "string", "name": "tanggal_pelaksanaan", "type": "string" },
      { "internalType": "bool", "name": "is_implemented", "type": "bool" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export function BlockchainProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  // Initialize blockchain service on mount
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        console.log('[BlockchainContext] Initializing blockchain connection...');
        
        // ✅ Validate environment variables
        const sepoliaUrl = import.meta.env.VITE_SEPOLIA_URL;
        const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
        const privateKey = import.meta.env.VITE_PRIVATE_KEY;

        if (!sepoliaUrl) {
          throw new Error('VITE_SEPOLIA_URL environment variable is not set');
        }

        if (!contractAddress) {
          throw new Error('VITE_CONTRACT_ADDRESS environment variable is not set');
        }

        if (!privateKey) {
          throw new Error('VITE_PRIVATE_KEY environment variable is not set');
        }

        // ✅ Verify ethers is available
        if (!ethers || typeof ethers.JsonRpcProvider !== 'function') {
          throw new Error('ethers library not properly loaded. Make sure ethers is installed: npm install ethers');
        }

        console.log('[BlockchainContext] Environment variables loaded');

        // ✅ Create provider untuk Sepolia
        const sepoliaProvider = new ethers.JsonRpcProvider(sepoliaUrl);
        console.log('[BlockchainContext] Provider created for Sepolia');

        // ✅ Verify provider connection
        const network = await sepoliaProvider.getNetwork();
        console.log('[BlockchainContext] Connected to network:', {
          chainId: network.chainId,
          name: network.name
        });

        // ✅ Create signer dari private key
        const signerInstance = new ethers.Wallet(privateKey, sepoliaProvider);
        console.log('[BlockchainContext] Signer created:', signerInstance.address);
        setWalletAddress(signerInstance.address);

        // ✅ Create contract instance
        const contractInstance = new ethers.Contract(
          contractAddress,
          CONTRACT_ABI,
          signerInstance
        );

        console.log('[BlockchainContext] Contract instance created:', {
          address: contractAddress,
          signerAddress: signerInstance.address
        });

        setProvider(sepoliaProvider);
        setSigner(signerInstance);
        setContract(contractInstance);
        setIsReady(true);
        setError(null);
        
        console.log('[BlockchainContext] ✅ Blockchain initialized successfully');
        
      } catch (err) {
        console.error('[BlockchainContext] Initialization error:', {
          message: err.message,
          stack: err.stack,
          type: err.constructor.name
        });

        setError(err.message || 'Failed to initialize blockchain');
        setIsReady(false);

        // ✅ Helpful error messages
        if (err.message.includes('ethers')) {
          console.error('[BlockchainContext] ❌ ethers library issue:');
          console.error('  Solution: npm install ethers@v6');
        }

        if (err.message.includes('environment variable')) {
          console.error('[BlockchainContext] ❌ Missing environment variable');
          console.error('  Check .env file for: VITE_SEPOLIA_URL, VITE_CONTRACT_ADDRESS, VITE_PRIVATE_KEY');
        }

        if (err.message.includes('Invalid JSON-RPC')) {
          console.error('[BlockchainContext] ❌ RPC URL invalid or unreachable');
          console.error('  Check VITE_SEPOLIA_URL in .env');
        }
      }
    };

    initBlockchain();
  }, []);

  // ✅ Helper function untuk get wallet status
  const getWalletStatus = () => {
    return {
      isReady,
      address: walletAddress,
      error,
      hasProvider: !!provider,
      hasSigner: !!signer,
      hasContract: !!contract
    };
  };

  // ✅ Helper function untuk get document dari blockchain
  const getDocument = async (docHash) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('[BlockchainContext] Fetching document:', docHash);
      const result = await contract.getDocument(docHash);
      console.log('[BlockchainContext] Document fetched:', result);
      return result;
    } catch (err) {
      console.error('[BlockchainContext] Error getting document:', err);
      throw err;
    }
  };

  return (
    <BlockchainContext.Provider value={{ 
      isReady, 
      contract, 
      provider,
      signer,
      error,
      walletAddress,
      getWalletStatus,
      getDocument
    }}>
      {children}
    </BlockchainContext.Provider>
  );
}

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
};
