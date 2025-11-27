import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { toast } from 'react-toastify';

/**
 * ✅ Custom hook for direct frontend blockchain transactions
 * No backend dependency - pure frontend ethers.js integration
 */
export function useBlockchainTransaction() {
  const { storeDocumentHash, isReady, error: contextError } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const storeToBlockchain = async (docType, formData, metadata = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (!isReady) {
        throw new Error('Blockchain service not ready - check your .env configuration');
      }

      console.log('[useBlockchainTransaction] Starting direct blockchain storage...');
      
      toast.info('📤 Storing data to Sepolia blockchain...', { autoClose: false });

      const result = await storeDocumentHash(docType, formData, {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'FRONTEND_DIRECT'
      });

      toast.dismiss();

      if (result.success) {
        console.log('[useBlockchainTransaction] ✅ Document stored successfully:', result);
        
        toast.success(
          <div>
            <p>✅ Data successfully stored on blockchain!</p>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline mt-1 block text-blue-600 hover:text-blue-800"
            >
              👀 View on Sepolia Etherscan →
            </a>
          </div>,
          { autoClose: 8000 }
        );

        return {
          success: true,
          ...result,
        };
      } else {
        throw new Error(result.error || 'Failed to store document on blockchain');
      }
    } catch (err) {
      console.error('[useBlockchainTransaction] Error:', err);
      setError(err.message);
      
      toast.error(
        <div>
          <p>❌ Blockchain storage failed</p>
          <p className="text-xs mt-1 text-gray-600">{err.message}</p>
        </div>,
        { autoClose: 6000 }
      );

      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify document on blockchain
  const verifyOnBlockchain = async (docHash) => {
    setLoading(true);
    setError(null);

    try {
      if (!isReady) {
        throw new Error('Blockchain service not ready');
      }

      toast.info('🔍 Verifying document on blockchain...', { autoClose: false });
      
      const { verifyDocumentHash } = useBlockchain();
      const result = await verifyDocumentHash(docHash);

      toast.dismiss();

      if (result.verified) {
        toast.success('✅ Document verified on blockchain!');
        return {
          success: true,
          verified: true,
          ...result
        };
      } else {
        toast.warning('⚠️ Document not found on blockchain');
        return {
          success: false,
          verified: false,
          error: result.error
        };
      }
    } catch (err) {
      console.error('[useBlockchainTransaction] Verification error:', err);
      setError(err.message);
      
      toast.error(`❌ Verification failed: ${err.message}`);
      
      return {
        success: false,
        verified: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    storeToBlockchain,
    verifyOnBlockchain,
    loading,
    error,
    isReady,
    contextError
  };
}
