import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX, FiRefreshCw, FiWifi, FiWifiOff, FiCheck, FiAlertCircle, FiActivity } from 'react-icons/fi';
import { useBlockchain } from '../contexts/BlockchainContext';
import api from '../api/axios';

export default function BlockchainDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realtimeData, setRealtimeData] = useState(null);
  const pollingRef = useRef(null);
  const { isReady, error, contract, walletAddress } = useBlockchain();

  // ✅ Run diagnostics
  const runDiagnostics = async () => {
    setLoading(true);
    const info = {
      metamaskInstalled: typeof window.ethereum !== 'undefined',
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

    setDiagnostics(info);
    setLoading(false);
  };

  return (
    <>
      {/* ✅ Floating Button dengan indicator real-time */}
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
        
        {/* Status indicator - real-time */}
        <motion.div
          className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
            isReady && contract ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Activity indicator */}
        {isOpen && (
          <motion.div
            className="absolute top-10 right-0 w-2 h-2 bg-blue-400 rounded-full"
            animate={{ scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* ✅ Debug Panel dengan Real-time Data */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-24 right-6 z-40 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  {isReady && contract ? (
                    <FiWifi className="w-5 h-5 text-green-300 animate-pulse" />
                  ) : (
                    <FiWifiOff className="w-5 h-5 text-red-300" />
                  )}
                  <h3 className="text-white font-bold">🔗 Blockchain Debug</h3>
                  <motion.div
                    className="w-2 h-2 bg-blue-200 rounded-full ml-2"
                    animate={{ scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
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
                {/* Status Summary */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border-2 border-emerald-200 dark:border-emerald-700">
                  <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-200 mb-3 flex items-center gap-2">
                    {isReady && contract ? (
                      <>
                        <FiCheck className="w-5 h-5 text-green-600" />
                        <span>✅ Blockchain Connected</span>
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="w-5 h-5 text-red-600" />
                        <span>❌ Blockchain Disconnected</span>
                      </>
                    )}
                  </h4>
                  <div className="space-y-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <p><strong>Status:</strong> {isReady ? '🟢 Connected' : '🔴 Disconnected'}</p>
                    <p><strong>Contract:</strong> {contract ? '🟢 Deployed' : '🔴 Not loaded'}</p>
                    <p><strong>Wallet:</strong> {walletAddress ? '🟢 Ready' : '🔴 No wallet'}</p>
                    {error && <p className="text-red-600 dark:text-red-400"><strong>Error:</strong> {error}</p>}
                  </div>
                </div>

                {/* ✅ Real-time Stats */}
                {realtimeData?.stats && (
                  <motion.div
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-2 flex items-center gap-2">
                      <FiActivity className="w-4 h-4" />
                      📊 Real-time Stats
                    </h4>
                    <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                      <p><strong>Total Perencanaan:</strong> {realtimeData.stats.stats?.total_perencanaan || 0}</p>
                      <p><strong>Total Implementasi:</strong> {realtimeData.stats.stats?.total_implementasi || 0}</p>
                      <p><strong>Total Monitoring:</strong> {realtimeData.stats.stats?.total_monitoring || 0}</p>
                    </div>
                  </motion.div>
                )}

                {/* ✅ Recent Transactions */}
                {realtimeData?.recentTransactions && realtimeData.recentTransactions.length > 0 && (
                  <motion.div
                    className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="font-bold text-purple-900 dark:text-purple-200 text-sm mb-2">
                      🔄 Recent Transactions ({realtimeData.recentTransactions.length})
                    </h4>
                    <div className="text-xs text-purple-800 dark:text-purple-300 space-y-2 max-h-32 overflow-y-auto">
                      {realtimeData.recentTransactions.slice(0, 3).map((tx, i) => (
                        <motion.div
                          key={i}
                          className="p-2 bg-white/50 dark:bg-gray-700/50 rounded font-mono"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <p className="truncate">Hash: {tx.hash?.substring(0, 20)}...</p>
                          <p className="text-xs">Status: {tx.status || 'Pending'}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Environment Info */}
                {diagnostics && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">⚙️ Environment</p>
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
                )}

                {/* Last Update Time */}
                <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                  🕐 Last update: {realtimeData?.timestamp ? new Date(realtimeData.timestamp).toLocaleTimeString('id-ID') : 'N/A'}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
                <motion.button
                  onClick={runDiagnostics}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  whileHover={!loading ? { scale: 1.05 } : {}}
                  whileTap={!loading ? { scale: 0.95 } : {}}
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Testing...' : 'Run Diagnostics'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
