import { useState, useEffect, useRef } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCopy, FiExternalLink, FiCheckCircle, FiAlertCircle, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

export default function WalletIndicator() {
  const { isConnected, account, balance, isReady, error } = useBlockchain();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });

  // ✅ Update button position when modal opens
  useEffect(() => {
    if (showModal && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showModal]);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      toast.success('📋 Address berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <>
      {/* Wallet Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setShowModal(!showModal)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg relative z-40 ${
          isConnected
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
        }`}
        whileHover={{ scale: 1.05, boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.5)' }}
        whileTap={{ scale: 0.95 }}
        title={isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-white/60'}`}></div>
          <FiBriefcase className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">
            {isConnected ? '💼 Wallet' : '⚠️ Wallet'}
          </span>
        </div>
      </motion.button>

      {/* ✅ Portal Modal - Render outside DOM hierarchy */}
      {showModal && createPortal(
        <AnimatePresence>
          <>
            {/* Overlay Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />

            {/* Modal Dropdown */}
            <motion.div
              style={{
                position: 'fixed',
                top: `${buttonPosition.top}px`,
                left: `${Math.max(16, Math.min(buttonPosition.left, window.innerWidth - 384 - 16))}px`,
                width: 'min(calc(100% - 32px), 384px)',
              }}
              className="z-[9999]"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                {/* Close Button */}
                <motion.button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>

                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <FiBriefcase className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    System Wallet
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isConnected ? '✅ Sepolia Testnet' : '❌ Disconnected'}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="mb-6 flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-semibold ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Wallet Details */}
                <div className="max-h-[50vh] overflow-y-auto scrollbar-premium space-y-4">
                  {isConnected && account ? (
                    <>
                      {/* Address Section */}
                      <motion.div
                        className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                        whileHover={{ translateY: -2 }}
                      >
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Wallet Address
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 truncate bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                            {account.slice(0, 10)}...{account.slice(-8)}
                          </code>
                          <motion.button
                            onClick={copyAddress}
                            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                              copied
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {copied ? <FiCheckCircle className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Balance Section */}
                      <motion.div
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700"
                        whileHover={{ translateY: -2 }}
                      >
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Sepolia ETH Balance
                        </p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {Number(balance).toFixed(4)} ETH
                        </p>
                      </motion.div>

                      {/* Network Info */}
                      <motion.div
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700"
                        whileHover={{ translateY: -2 }}
                      >
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Network Information
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Network:</span>
                            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">Sepolia</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Chain ID:</span>
                            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">11155111</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Info Text */}
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        💼 System-managed wallet • 🔒 Private key aman di .env
                      </p>
                    </>
                  ) : (
                    <motion.div
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start gap-3">
                        <FiAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                            Wallet Disconnected
                          </h3>
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            {error || 'Blockchain service sedang offline. Data tetap disimpan di database.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
