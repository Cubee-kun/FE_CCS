import { useBlockchain } from '../contexts/BlockchainContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertCircle, FiCheck, FiWifi, FiWifiOff } from 'react-icons/fi';
import { useState } from 'react';

export default function BlockchainDebug() {
  const { isConnected, isReady, account, chainId, error, connectWallet, reconnect } = useBlockchain();
  const [isOpen, setIsOpen] = useState(false);

  if (!isReady) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 max-w-sm"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
        >
          <div className={`rounded-xl shadow-2xl border-2 p-4 ${
            isConnected
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <FiWifi className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <FiWifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
                <h3 className={`font-bold ${
                  isConnected
                    ? 'text-green-900 dark:text-green-200'
                    : 'text-amber-900 dark:text-amber-200'
                }`}>
                  {isConnected ? '✅ Blockchain Connected' : '⚠️ Not Connected'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Status Info */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-mono font-semibold ${
                  isConnected ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {account && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account:</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              )}

              {chainId && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Chain ID:</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {chainId === 11155111 ? '🔗 Sepolia (11155111)' : `❌ Unknown (${chainId})`}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-semibold transition-all"
                >
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={reconnect}
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-semibold transition-all"
                >
                  Reconnect
                </button>
              )}
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Ensure MetaMask is installed and set to Sepolia testnet
            </p>
          </div>
        </motion.div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Blockchain Status"
        >
          {isConnected ? (
            <FiWifi className="w-6 h-6" />
          ) : (
            <FiWifiOff className="w-6 h-6" />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
