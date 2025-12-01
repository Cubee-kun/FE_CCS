import React, { createContext, useContext, useEffect, useState } from 'react';
import blockchainService from '../services/blockchain.js'; // ✅ FIXED: Use default import

const BlockchainContext = createContext();

export function BlockchainProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Initialize blockchain service on mount
  useEffect(() => {
    const initializeBlockchain = async () => {
      try {
        console.log('[BlockchainContext] Initializing blockchain service...');
        
        const initialized = await blockchainService.initialize();
        
        if (initialized) {
          setIsReady(true);
          setIsConnected(true);
          setWalletAddress(blockchainService.getWalletAddress());
          
          const status = await blockchainService.getWalletStatus();
          setWalletStatus(status);
          
          console.log('[BlockchainContext] ✅ Blockchain service ready');
          setError(null);
        } else {
          throw new Error('Failed to initialize blockchain service');
        }
      } catch (err) {
        console.error('[BlockchainContext] ❌ Initialization error:', err.message);
        setError(err.message);
        setIsReady(false);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    initializeBlockchain();
  }, []);

  // ✅ Store document directly to blockchain
  const storeDocumentHash = async (docType, formData, metadata = {}) => {
    try {
      if (!isReady) {
        throw new Error('Blockchain service not ready');
      }

      return await blockchainService.storeDocumentToBlockchain(formData, {
        docType,
        ...metadata,
        walletAddress
      });
    } catch (error) {
      console.error('[BlockchainContext] Store error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ✅ Get document directly from blockchain
  const getDocument = async (docIdOrHash) => {
    try {
      if (!isReady) {
        throw new Error('Blockchain service not ready');
      }

      // Check if it's a doc ID (number) or hash (0x...)
      if (typeof docIdOrHash === 'number' || /^\d+$/.test(docIdOrHash)) {
        return await blockchainService.getDocumentById(docIdOrHash);
      } else if (typeof docIdOrHash === 'string' && docIdOrHash.startsWith('0x')) {
        return await blockchainService.verifyDocumentOnBlockchain(docIdOrHash);
      } else {
        throw new Error('Invalid document ID or hash format');
      }
    } catch (error) {
      console.error('[BlockchainContext] Get document error:', error);
      return null;
    }
  };

  // ✅ Verify document hash directly on blockchain
  const verifyDocumentHash = async (docHash) => {
    try {
      if (!isReady) {
        throw new Error('Blockchain service not ready');
      }

      return await blockchainService.verifyDocumentOnBlockchain(docHash);
    } catch (error) {
      console.error('[BlockchainContext] Verification error:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  };

  // ✅ Get transaction proof directly from blockchain
  const getTransactionProof = async (txHash) => {
    try {
      if (!isReady) {
        throw new Error('Blockchain service not ready');
      }

      return await blockchainService.fetchTransactionFromSepolia(txHash);
    } catch (error) {
      console.error('[BlockchainContext] Transaction proof error:', error);
      return null;
    }
  };

  // ✅ Get all documents from blockchain
  const getAllDocuments = async (startId = 0, limit = 50) => {
    try {
      if (!isReady) {
        throw new Error('Blockchain service not ready');
      }

      return await blockchainService.getAllDocuments(startId, limit);
    } catch (error) {
      console.error('[BlockchainContext] Get all documents error:', error);
      return {
        documents: [],
        totalCount: 0,
        error: error.message
      };
    }
  };

  // ✅ Get blockchain explorer URL
  const getExplorerUrl = (txHash) => {
    return blockchainService.getExplorerUrl(txHash);
  };

  // ✅ Get blockchain status
  const getBlockchainStatus = () => {
    return {
      isReady,
      isConnected,
      walletAddress,
      walletStatus,
      error,
      loading
    };
  };

  const value = {
    // Status
    isReady,
    isConnected,
    loading,
    error,
    walletAddress,
    walletStatus,
    
    // Functions
    storeDocumentHash,
    getDocument,
    verifyDocumentHash,
    getTransactionProof,
    getAllDocuments,
    getExplorerUrl,
    getBlockchainStatus,
    
    // Direct access to service (for advanced usage)
    blockchainService
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
