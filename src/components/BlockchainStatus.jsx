import { useBlockchain } from '../contexts/BlockchainContext';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiLoader, FiCopy, FiExternalLink, FiWifi, FiWifiOff } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function BlockchainStatus() {
  const { 
    isReady, 
    isConnected, 
    loading, 
    walletAddress, 
    walletStatus, 
    error,
    getExplorerUrl 
  } = useBlockchain();

  if (loading) {
    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <FiLoader className="w-4 h-4" />
        </motion.div>
        <span className="text-xs font-medium">Initializing blockchain...</span>
      </motion.div>
    );
  }

  if (!isReady || error) {
    return (
      <motion.div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <FiWifiOff className="w-4 h-4" />
        <span className="text-xs font-medium">Blockchain unavailable</span>
        {error && (
          <span className="text-xs ml-1 opacity-75">({error})</span>
        )}
      </motion.div>
    );
  }

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    toast.success('📋 Wallet address copied!');
  };

  const viewOnExplorer = () => {
    if (!walletAddress) return;
    window.open(`https://sepolia.etherscan.io/address/${walletAddress}`, '_blank');
  };

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <FiCheck className="w-4 h-4" />
      <span className="text-xs font-medium">
        {isReady ? '✅ Blockchain Ready' : '⏳ Loading'}
      </span>
      {walletAddress && (
        <span className="text-xs opacity-70 ml-1">
          ({walletAddress.substring(0, 6)}...{walletAddress.substring(-4)})
        </span>
      )}

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <motion.div 
          className="w-2 h-2 rounded-full bg-green-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <FiWifi className="w-4 h-4 text-green-600 dark:text-green-400" />
      </div>
      
      {/* Wallet Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-green-700 dark:text-green-300">
          🔗 Blockchain: Connected
        </div>
        {walletAddress && (
          <div className="flex items-center gap-1">
            <code className="text-xs font-mono text-green-600 dark:text-green-400 truncate">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </code>
          </div>
        )}
      </div>

      {/* Balance */}
      {walletStatus?.balance && (
        <div className="text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
          {parseFloat(walletStatus.balance).toFixed(4)} ETH
        </div>
      )}

      {/* Network Info */}
      {walletStatus?.network && (
        <div className="text-xs text-green-600 dark:text-green-400 capitalize">
          {walletStatus.network}
        </div>
      )}

      {/* Copy Button */}
      <motion.button
        onClick={copyAddress}
        className="p-1.5 hover:bg-green-200 dark:hover:bg-green-800/50 rounded transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Copy wallet address"
      >
        <FiCopy className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
      </motion.button>

      {/* View on Etherscan */}
      <motion.button
        onClick={viewOnExplorer}
        className="p-1.5 hover:bg-green-200 dark:hover:bg-green-800/50 rounded transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="View on Etherscan"
      >
        <FiExternalLink className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
      </motion.button>
    </motion.div>
  );
}
