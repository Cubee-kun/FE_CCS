import { useBlockchain } from '../contexts/BlockchainContext';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiCopy, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function BlockchainStatus() {
  const { isReady, walletAddress, walletStatus, loading } = useBlockchain();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
        <span>Initializing...</span>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm">
        <FiAlertCircle className="w-4 h-4" />
        <span>Blockchain unavailable</span>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success('📋 Address copied!');
  };

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <FiCheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          💎 Blockchain: Active
        </div>
        <div className="flex items-center gap-1">
          <code className="text-xs font-mono text-purple-600 dark:text-purple-400 truncate">
            {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
          </code>
        </div>
      </div>

      {/* Copy Button */}
      <motion.button
        onClick={copyAddress}
        className="p-1.5 hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Copy wallet address"
      >
        <FiCopy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
      </motion.button>

      {/* View on Etherscan */}
      <a
        href={`https://sepolia.etherscan.io/address/${walletAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded transition-colors"
        title="View on Etherscan"
      >
        <FiExternalLink className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
      </a>

      {/* Balance */}
      {walletStatus?.balance && (
        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
          {parseFloat(walletStatus.balance).toFixed(4)} ETH
        </div>
      )}
    </motion.div>
  );
}
