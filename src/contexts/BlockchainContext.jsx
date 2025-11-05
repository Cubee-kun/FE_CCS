import { createContext, useContext, useState, useEffect } from 'react';
import blockchainService from '../services/blockchain';
import { toast } from 'react-toastify';

const BlockchainContext = createContext();

export function BlockchainProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    if (blockchainService.isMetaMaskInstalled()) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            connectWallet();
          }
        });

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    const result = await blockchainService.connectWallet();
    
    if (result) {
      setAccount(result.account);
      setNetwork(result.network);
      setIsConnected(true);
    }
    
    setIsConnecting(false);
    return result;
  };

  const disconnect = () => {
    blockchainService.disconnectWallet();
    setAccount(null);
    setNetwork(null);
    setIsConnected(false);
  };

  const storeDocument = async (docType, formData, metadata) => {
    if (!isConnected) {
      toast.warning('⚠️ Silakan hubungkan wallet terlebih dahulu');
      return null;
    }

    return await blockchainService.storeDocumentHash(docType, formData, metadata);
  };

  const getDocument = async (docId) => {
    return await blockchainService.getDocument(docId);
  };

  const verifyDocument = async (docId, formData) => {
    return await blockchainService.verifyDocumentHash(docId, formData);
  };

  return (
    <BlockchainContext.Provider
      value={{
        account,
        network,
        isConnected,
        isConnecting,
        connectWallet,
        disconnect,
        storeDocument,
        getDocument,
        verifyDocument,
      }}
    >
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
