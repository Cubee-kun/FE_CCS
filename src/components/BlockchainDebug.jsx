import { useBlockchain } from '../contexts/BlockchainContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertCircle, FiCheck, FiWifi, FiWifiOff, FiServer } from 'react-icons/fi';
import { useState } from 'react';

export default function BlockchainDebug() {
  const { isConnected, isReady, blockchainStatus, walletAddress, error, getBlockchainStatus } = useBlockchain();
  const [isOpen, setIsOpen] = useState(false);
  const status = getBlockchainStatus();

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
                  {isConnected ? '✅ Blockchain: Connected' : '⚠️ Blockchain: Disconnected'}
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
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <FiServer className="w-3 h-3" />
                  Backend Status:
                </span>
                <span className={`font-mono font-semibold ${
                  isConnected ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {blockchainStatus}
                </span>
              </div>
              
              {walletAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Wallet Address:</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Chain:</span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  🔗 Sepolia (11155111)
                </span>
              </div>
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

            {/* Info Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              💼 Backend-powered blockchain • 🔐 Auto transactions
            </p>
          </div>
        </motion.div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center transition-all ${
            isConnected
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
              : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
          }`}
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
