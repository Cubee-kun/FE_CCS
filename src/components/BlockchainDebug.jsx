import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { motion } from 'framer-motion';
import { FiCode, FiCheckCircle, FiX } from 'react-icons/fi';

export default function BlockchainDebug() {
  const { isConnected, account, network, connectWallet } = useBlockchain();
  const [debugInfo, setDebugInfo] = useState(null);
  const [testing, setTesting] = useState(false);

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

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiCode className="w-5 h-5 text-purple-600" />
            Blockchain Debug
          </h3>
          <button
            onClick={() => setDebugInfo(null)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '✅ Connected' : '❌ Not Connected'}
            </span>
          </div>

          {account && (
            <div className="text-xs">
              <span className="text-gray-600 dark:text-gray-400">Account:</span>
              <code className="block bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1 break-all">
                {account}
              </code>
            </div>
          )}

          {network && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Network:</span>
              <span className="font-semibold">{network}</span>
            </div>
          )}
        </div>

        {debugInfo && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-2">
          {!isConnected && (
            <button
              onClick={connectWallet}
              className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
            >
              Connect
            </button>
          )}
          <button
            onClick={runDiagnostics}
            disabled={testing}
            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium"
          >
            {testing ? 'Testing...' : 'Test'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
