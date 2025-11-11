import { createContext, useContext, useState, useEffect } from 'react';
import blockchainService from '../services/blockchain';
import { toast } from 'react-toastify';

const BlockchainContext = createContext();

export function BlockchainProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize blockchain service on mount
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        const result = await blockchainService.initialize();
        
        if (result) {
          const address = blockchainService.getWalletAddress();
          const status = await blockchainService.getWalletStatus();
          
          setWalletAddress(address);
          setWalletStatus(status);
          setIsReady(true);
          
          console.log('[BlockchainContext] Initialized:', {
            address,
            status
          });
          
          toast.success(`💎 Blockchain siap! Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`);
        } else {
          setIsReady(false);
          toast.warning('⚠️ Blockchain service tidak tersedia');
        }
      } catch (error) {
        console.error('[BlockchainContext] Init error:', error);
        setIsReady(false);
      } finally {
        setLoading(false);
      }
    };

    initBlockchain();
  }, []);

  const storeDocument = async (docType, formData, metadata) => {
    if (!isReady) {
      toast.error('❌ Blockchain service tidak tersedia!');
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
        isReady,
        walletAddress,
        walletStatus,
        loading,
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
