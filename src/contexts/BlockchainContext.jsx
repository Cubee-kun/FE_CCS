import React, { createContext, useContext, useEffect, useState } from 'react';
import blockchainService from '../services/blockchain.js';

const BlockchainContext = createContext();

export function BlockchainProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('UNKNOWN'); // READ_ONLY, READ_WRITE, DEGRADED, FAILED

  // ✅ Enhanced initialization with production error handling
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
          setMode(status.mode || 'READ_only');
          
          console.log('[BlockchainContext] ✅ Blockchain service ready:', status);
          setError(null);
        } else {
          throw new Error('Failed to initialize blockchain service');
        }
      } catch (err) {
        console.error('[BlockchainContext] ❌ Initialization error:', err.message);
        
        // ✅ PRODUCTION: Allow graceful degradation
        if (import.meta.env.PROD) {
          console.warn('[BlockchainContext] Production: Running in degraded mode');
          setError(`Blockchain temporarily unavailable: ${err.message}`);
          setIsReady(false);
          setIsConnected(false);
          setMode('DEGRADED');
        } else {
          setError(err.message);
          setIsReady(false);
          setIsConnected(false);
          setMode('FAILED');
        }
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
        if (mode === 'DEGRADED') {
          return {
            success: false,
            error: 'Blockchain service temporarily unavailable - data saved locally only',
            degraded: true
          };
        }
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

  // ✅ Get document directly from blockchain with better error handling
  const getDocument = async (docIdOrHash) => {
    try {
      if (!isReady) {
        if (mode === 'DEGRADED') {
          return null; // Gracefully return null instead of error
        }
        throw new Error('Blockchain service not ready');
      }

      // ✅ FIXED: Better validation for document ID vs hash
      if (typeof docIdOrHash === 'number' || /^\d+$/.test(docIdOrHash)) {
        console.log('[BlockchainContext] Getting document by ID:', docIdOrHash);
        
        const result = await blockchainService.getDocumentById(docIdOrHash);
        
        // ✅ Handle "Invalid document ID" gracefully
        if (!result.verified && result.error?.includes('Invalid document ID')) {
          console.warn('[BlockchainContext] Document ID not found:', docIdOrHash);
          return null; // Return null instead of throwing error
        }
        
        return result;
        
      } else if (typeof docIdOrHash === 'string' && docIdOrHash.startsWith('0x')) {
        console.log('[BlockchainContext] Verifying document by hash:', docIdOrHash.substring(0, 20) + '...');
        
        const result = await blockchainService.verifyDocumentOnBlockchain(docIdOrHash);
        
        // ✅ Always return result, even if not verified
        return result;
        
      } else {
        throw new Error(`Invalid document identifier format: ${docIdOrHash}`);
      }
    } catch (error) {
      console.error('[BlockchainContext] Get document error:', error);
      
      // ✅ Return structured error response instead of null
      return {
        verified: false,
        error: error.message,
        docIdOrHash: docIdOrHash,
        contextError: true
      };
    }
  };

  // ✅ Enhanced verification with production error handling
  const verifyDocumentHash = async (docHash) => {
    try {
      if (!isReady) {
        if (mode === 'DEGRADED') {
          return {
            verified: false,
            error: 'Blockchain service temporarily unavailable',
            docHash,
            degraded: true
          };
        }
        throw new Error('Blockchain service not ready');
      }

      return await blockchainService.verifyDocumentOnBlockchain(docHash);
    } catch (error) {
      console.error('[BlockchainContext] Verification error:', error);
      return {
        verified: false,
        error: error.message,
        docHash,
        contextError: true
      };
    }
  };

  // ✅ Get transaction proof directly from blockchain
  const getTransactionProof = async (txHash) => {
    try {
      if (!isReady) {
        return null;
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
        return {
          documents: [],
          totalCount: 0,
          error: mode === 'DEGRADED' ? 'Service temporarily unavailable' : 'Service not ready'
        };
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
      loading,
      mode
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
    mode, // ✅ NEW: Service mode indicator
    
    // Functions with enhanced error handling
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
