import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiExternalLink, FiXCircle, FiSearch, FiAlertTriangle, FiSend } from 'react-icons/fi';

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
      
      toast.info('Storing data to Polygon mainnet...', {
        autoClose: false,
        icon: <FiSend />,
      });

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
            <p className="inline-flex items-center gap-2">
              <FiCheckCircle className="text-emerald-600" />
              <span>Data successfully stored on blockchain</span>
            </p>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline mt-1 flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <FiExternalLink />
              <span>View on PolygonScan</span>
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
          <p className="inline-flex items-center gap-2">
            <FiXCircle className="text-red-600" />
            <span>Blockchain storage failed</span>
          </p>
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

      toast.info('Verifying document on blockchain...', {
        autoClose: false,
        icon: <FiSearch />,
      });
      
      const { verifyDocumentHash } = useBlockchain();
      const result = await verifyDocumentHash(docHash);

      toast.dismiss();

      if (result.verified) {
        toast.success('Document verified on blockchain', { icon: <FiCheckCircle /> });
        return {
          success: true,
          verified: true,
          ...result
        };
      } else {
        toast.warning('Document not found on blockchain', { icon: <FiAlertTriangle /> });
        return {
          success: false,
          verified: false,
          error: result.error
        };
      }
    } catch (err) {
      console.error('[useBlockchainTransaction] Verification error:', err);
      setError(err.message);
      
      toast.error(`Verification failed: ${err.message}`, { icon: <FiXCircle /> });
      
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
