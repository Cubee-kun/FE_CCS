import { useState, useEffect, useRef } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCopy, FiCheckCircle, FiAlertCircle, FiBriefcase, FiLock, FiWifiOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

export default function WalletIndicator() {
  const { isConnected, account, balance, isReady, error, loading, connectWallet } = useBlockchain();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showModal || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(384, window.innerWidth - 32);
      const left = Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16));
      setPanelPosition({
        top: rect.bottom + 12,
        left,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setShowModal(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      toast.success('Address berhasil disalin');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <div className="relative z-40">
      {/* Wallet Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setShowModal(!showModal)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg ${
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
            {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
          </span>
        </div>
      </motion.button>

      {showModal && createPortal(
        <AnimatePresence>
          <motion.div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: `${panelPosition.top}px`,
              left: `${panelPosition.left}px`,
              width: 'min(24rem, calc(100vw - 2rem))',
            }}
            className="z-[10000]"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
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
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                    {isConnected ? (
                      <>
                        <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Sepolia Testnet</span>
                      </>
                    ) : (
                      <>
                        <FiWifiOff className="w-4 h-4 text-amber-500" />
                        <span>Disconnected</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-6 flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                  <span className={`text-sm font-semibold ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
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
                          <motion.button
                            onClick={connectWallet}
                            disabled={loading}
                            className={`mt-3 inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                              loading
                                ? 'bg-amber-300/60 text-amber-800 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                            }`}
                            whileHover={loading ? undefined : { scale: 1.03 }}
                            whileTap={loading ? undefined : { scale: 0.97 }}
                          >
                            {loading ? 'Connecting...' : 'Connect Wallet'}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
