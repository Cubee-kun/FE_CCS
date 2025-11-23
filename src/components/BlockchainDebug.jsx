import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX, FiRefreshCw, FiWifi, FiWifiOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useBlockchain } from '../contexts/BlockchainContext';

export default function BlockchainDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isReady, error, contract } = useBlockchain();

  // ✅ Run diagnostics
  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const results = {
        timestamp: new Date().toISOString(),
        blockchain: {
          isReady,
          error: error || 'No errors',
          contractExists: !!contract,
          contractAddress: contract?.address || 'N/A',
        },
        environment: {
          rpcUrl: import.meta.env.VITE_SEPOLIA_URL ? '✅ Configured' : '❌ Missing',
          contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS ? '✅ Configured' : '❌ Missing',
          privateKey: import.meta.env.VITE_PRIVATE_KEY ? '✅ Configured' : '❌ Missing',
        },
        connection: {
          web3Available: typeof window.web3 !== 'undefined' ? '✅ Yes' : '❌ No',
          ethersAvailable: typeof window.ethers !== 'undefined' ? '✅ Yes' : '❌ No',
        },
      };

      setDiagnostics(results);
      console.log('[BlockchainDebug] Diagnostics:', results);
    } catch (err) {
      console.error('[BlockchainDebug] Diagnostics error:', err);
      setDiagnostics({
        timestamp: new Date().toISOString(),
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-run diagnostics on mount
  useEffect(() => {
    if (import.meta.env.DEV) {
      runDiagnostics();
    }
  }, []);

  // ✅ Auto-update status
  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(runDiagnostics, 5000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  return (
    <>
      {/* ✅ Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Blockchain Debug Panel"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FiChevronDown className="w-6 h-6" />
        </motion.div>
        
        {/* Status indicator */}
        <motion.div
          className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
            isReady ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* ✅ Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-24 right-6 z-40 w-96 max-h-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isReady ? (
                    <FiWifi className="w-5 h-5 text-green-300 animate-pulse" />
                  ) : (
                    <FiWifiOff className="w-5 h-5 text-red-300" />
                  )}
                  <h3 className="text-white font-bold">🔗 Blockchain Debug</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Status */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    📊 Status
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Connection:</span>
                      <div className="flex items-center gap-1">
                        <span className={isReady ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                          {isReady ? 'Connected' : 'Disconnected'}
                        </span>
                        {isReady ? (
                          <FiCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <FiAlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Contract:</span>
                      <span className={contract ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                        {contract ? '✅ Ready' : '⚠️ Loading'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error if any */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold text-sm text-red-700 dark:text-red-300 mb-1 flex items-center gap-2">
                      ⚠️ Error
                    </h4>
                    <p className="text-xs text-red-600 dark:text-red-400 break-words">
                      {error}
                    </p>
                  </div>
                )}

                {/* Diagnostics Results */}
                {diagnostics && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      🔍 Diagnostics
                    </h4>
                    
                    {/* Environment */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Environment:
                      </p>
                      <div className="text-xs space-y-1 ml-2">
                        {Object.entries(diagnostics.environment || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                            <span className={value.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Connection */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Connection:
                      </p>
                      <div className="text-xs space-y-1 ml-2">
                        {Object.entries(diagnostics.connection || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                            <span className={value.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Last update: {diagnostics.timestamp}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-2">
                <button
                  onClick={runDiagnostics}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-all"
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Testing...' : 'Run Diagnostics'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
