import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiCheckCircle, FiX, FiMinimize2, FiMaximize2, FiWifi, FiWifiOff, FiAlertCircle } from 'react-icons/fi';

export default function BlockchainDebug() {
  const { isReady, walletAddress, walletStatus, loading } = useBlockchain();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const info = {
      blockchainReady: isReady,
      walletAddress: walletAddress,
      walletStatus: walletStatus,
      timestamp: new Date().toISOString(),
      network: walletStatus?.network || 'Unknown',
      chainId: walletStatus?.chainId || 'N/A',
      balance: walletStatus?.balance || '0'
    };

    setDebugInfo(info);
    setTesting(false);
  };

  if (!isVisible) {
    return (
      <motion.button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full shadow-xl z-40 group"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Show Blockchain Debug Panel"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <FiCode className="w-5 h-5" />
        </motion.div>
        {/* Tooltip */}
        <motion.div
          className="absolute bottom-full mb-3 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
          initial={{ opacity: 0, y: 5 }}
          whileHover={{ opacity: 1, y: 0 }}
        >
          Show Debug Panel
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </motion.div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          width: isMinimized ? '280px' : '420px'
        }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-700 overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <FiCode className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="font-bold text-white text-sm">
                  3TREESIFY Blockchain Debug
                </h3>
              </div>

              <div className="flex items-center gap-1">
                {/* Minimize/Maximize Button */}
                <motion.button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? (
                    <FiMaximize2 className="w-4 h-4 text-white group-hover:text-yellow-200 transition-colors" />
                  ) : (
                    <FiMinimize2 className="w-4 h-4 text-white group-hover:text-yellow-200 transition-colors" />
                  )}
                </motion.button>

                {/* Close Button */}
                <motion.button
                  onClick={() => setIsVisible(false)}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group relative"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  title="Close Debug Panel"
                >
                  <FiX className="w-4 h-4 text-white group-hover:text-red-200 transition-colors" />
                  
                  {/* Close Tooltip */}
                  <motion.div
                    className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
                    initial={{ opacity: 0, y: 5 }}
                    whileHover={{ opacity: 1, y: 0 }}
                  >
                    Close Panel
                    <div className="absolute bottom-0 right-2 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Content - Only show when not minimized */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4">
                  {/* Loading State */}
                  {loading ? (
                    <motion.div
                      className="flex items-center justify-center py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="text-center">
                        <motion.div
                          className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full mx-auto mb-3"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Initializing Blockchain...
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Status Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Status</span>
                          <motion.div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isReady
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            }`}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {isReady ? (
                              <>
                                <FiWifi className="w-3 h-3" />
                                Connected
                              </>
                            ) : (
                              <>
                                <FiWifiOff className="w-3 h-3" />
                                Not Connected
                              </>
                            )}
                          </motion.div>
                        </div>

                        {/* Status Details */}
                        {isReady && walletStatus && (
                          <motion.div
                            className="space-y-2 bg-green-50 dark:bg-green-900/10 rounded-lg p-3 border border-green-200 dark:border-green-800"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Network:</span>
                              <span className="text-xs font-semibold text-green-700 dark:text-green-300 capitalize">
                                {walletStatus.network}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Balance:</span>
                              <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                {parseFloat(walletStatus.balance).toFixed(4)} ETH
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {!isReady && (
                          <motion.div
                            className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-200 dark:border-amber-800 flex items-start gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <FiAlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              Blockchain service initializing. Check console for details.
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {/* Wallet Address Section */}
                      {walletAddress && (
                        <motion.div
                          className="mb-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 border border-purple-200 dark:border-purple-800"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Wallet Address:</p>
                          <code className="block text-xs font-mono text-purple-700 dark:text-purple-300 break-all truncate">
                            {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                          </code>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Full: {walletAddress}
                          </p>
                        </motion.div>
                      )}

                      {/* Debug Info */}
                      {debugInfo && (
                        <motion.div
                          className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Debug Info:</span>
                            <motion.button
                              onClick={() => setDebugInfo(null)}
                              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FiX className="w-3 h-3" />
                            </motion.button>
                          </div>
                          <div className="text-xs space-y-1 font-mono text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                            <div>Ready: {debugInfo.blockchainReady ? '✅' : '❌'}</div>
                            <div>Network: {debugInfo.network}</div>
                            <div>Chain ID: {debugInfo.chainId}</div>
                            <div>Balance: {debugInfo.balance}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(debugInfo.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <motion.button
                          onClick={runDiagnostics}
                          disabled={testing}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            testing
                              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                          }`}
                          whileHover={!testing ? { scale: 1.02 } : {}}
                          whileTap={!testing ? { scale: 0.98 } : {}}
                        >
                          {testing ? (
                            <span className="flex items-center justify-center gap-1">
                              <motion.div
                                className="w-2 h-2 border border-gray-500 border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Testing
                            </span>
                          ) : (
                            'Run Diagnostics'
                          )}
                        </motion.button>
                        
                        {isReady && (
                          <motion.button
                            onClick={() => {
                              navigator.clipboard.writeText(walletAddress);
                              alert('Wallet address copied!');
                            }}
                            className="flex-1 px-3 py-2 bg-purple-200 dark:bg-purple-900/30 hover:bg-purple-300 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Copy Address
                          </motion.button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimized view */}
          {isMinimized && (
            <motion.div
              className="p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {isReady ? 'Blockchain Ready' : 'Initializing'}
                </span>
              </div>
              {isReady && walletAddress && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate font-mono">
                  {walletAddress.slice(0, 8)}...
                </p>
              )}
            </motion.div>
          )}

          {/* Footer indicator */}
          <div className="h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
