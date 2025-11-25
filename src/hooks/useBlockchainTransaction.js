import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { toast } from 'react-toastify';

/**
 * ✅ Custom hook untuk blockchain transactions via backend
 * User tidak perlu connect MetaMask, backend yang handle semuanya
 */
export function useBlockchainTransaction() {
  const { storeDocumentHash, isConnected } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const storeToBlockchain = async (docType, formData, metadata = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (!isConnected) {
        throw new Error('Blockchain service sedang offline, data tetap disimpan di database');
      }

      toast.info('📤 Menyimpan data ke blockchain...', { autoClose: false });

      const result = await storeDocumentHash(docType, formData, metadata);

      toast.dismiss();

      if (result.success) {
        console.log('[useBlockchainTransaction] ✅ Document stored:', result);
        
        toast.success(
          <div>
            <p>✅ Data berhasil disimpan ke blockchain!</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline mt-1 block"
            >
              👀 Lihat di Etherscan →
            </a>
          </div>,
          { autoClose: 5000 }
        );

        return {
          success: true,
          ...result,
        };
      } else {
        throw new Error(result.error || 'Failed to store document');
      }
    } catch (err) {
      console.error('[useBlockchainTransaction] Error:', err);
      setError(err.message);
      
      // ✅ Fallback: data tetap disimpan di database meskipun blockchain gagal
      toast.warning(
        `⚠️ ${err.message}\n\n💾 Data tetap tersimpan di database`,
        { autoClose: 4000 }
      );

      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    storeToBlockchain,
    loading,
    error,
  };
}
