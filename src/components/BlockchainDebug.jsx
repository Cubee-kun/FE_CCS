import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiCheckCircle, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';

export default function BlockchainDebug() {
  const { isConnected, account, network, connectWallet } = useBlockchain();
  const [debugInfo, setDebugInfo] = useState(null);
  const [testing, setTesting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const runDiagnostics = async () => {
    setTesting(true);
    const info = {
      metamaskInstalled: typeof window.ethereum !== 'undefined',
      isConnected,
      account,
      network,
      timestamp: new Date().toISOString()
    };

    // Check network
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        info.chainId = chainId;
        info.isSepoliaNetwork = chainId === '0xaa36a7';
      } catch (error) {
        info.error = error.message;
      }
    }

    setDebugInfo(info);
    setTesting(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          width: isMinimized ? '240px' : '380px'
        }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-700 overflow-hidden backdrop-blur-xl">
          {/* ✅ Header dengan Close & Minimize buttons yang lebih user-friendly */}
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
                  Blockchain Debug
                </h3>
              </div>

              {/* ✅ Action buttons */}
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

                {/* Close Button - Enhanced */}
                <motion.button
                  onClick={() => setIsVisible(false)}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group relative"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  title="Close Debug Panel"
                >
                  <FiX className="w-4 h-4 text-white group-hover:text-red-200 transition-colors" />
                  
                  {/* ✅ Tooltip on hover */}
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

          {/* ✅ Content - Only show when not minimized */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4">
                  {/* Status */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Status:</span>
                      <motion.span 
                        className={`font-semibold flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}
                        animate={{ scale: isConnected ? [1, 1.05, 1] : 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {isConnected ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Connected
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Not Connected
                          </>
                        )}
                      </motion.span>
                    </div>

                    {account && (
                      <div className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Account:</span>
                        <code className="block bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg mt-1 break-all text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {account}
                        </code>
                      </div>
                    )}

                    {network && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Network:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">
                          {network}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Debug Info */}
                  {debugInfo && (
                    <motion.div 
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-4 border border-gray-200 dark:border-gray-700"
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
                      <pre className="text-xs overflow-auto max-h-32 scrollbar-thin text-gray-800 dark:text-gray-200">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!isConnected ? (
                      <motion.button
                        onClick={connectWallet}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg transition-all"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Connect Wallet
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={runDiagnostics}
                        disabled={testing}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          testing 
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500' 
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                        }`}
                        whileHover={!testing ? { scale: 1.02 } : {}}
                        whileTap={!testing ? { scale: 0.98 } : {}}
                      >
                        {testing ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Testing...
                          </span>
                        ) : (
                          'Run Diagnostics'
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ✅ Minimized view */}
          {isMinimized && (
            <motion.div 
              className="p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {isConnected && (
                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </motion.div>
          )}

          {/* ✅ Footer indicator */}
          <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
        </div>

        {/* ✅ Reopen button when closed */}
        {!isVisible && (
          <motion.button
            onClick={() => setIsVisible(true)}
            className="fixed bottom-4 right-4 p-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full shadow-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Show Debug Panel"
          >
            <FiCode className="w-5 h-5" />
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
