import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const BlockchainContext = createContext();

export function BlockchainProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);

  // ✅ Initialize blockchain connection dengan error handling
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        console.log('[BlockchainContext] Initializing blockchain connection...');
        
        // ✅ Check if MetaMask is installed
        if (!window.ethereum) {
          console.warn('[BlockchainContext] ⚠️ MetaMask not installed');
          setError('MetaMask tidak terinstall. Silakan install extension MetaMask terlebih dahulu.');
          setIsReady(true);
          return;
        }

        console.log('[BlockchainContext] ✅ MetaMask detected');

        // ✅ Create provider dari injected ethereum
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        // ✅ Request account access
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });

          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            console.log('[BlockchainContext] ✅ Connected to account:', accounts[0]);

            // ✅ Get signer
            const ethSigner = await ethProvider.getSigner();
            setSigner(ethSigner);

            // ✅ Get chain ID
            const network = await ethProvider.getNetwork();
            setChainId(Number(network.chainId));
            console.log('[BlockchainContext] ✅ Connected to chain:', network.chainId, network.name);
          }
        } catch (err) {
          if (err.code === 'ACTION_REJECTED') {
            console.log('[BlockchainContext] User rejected account access');
            setError('Anda menolak akses wallet. Silakan coba lagi.');
          } else {
            throw err;
          }
        }

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('[BlockchainContext] ❌ Initialization error:', err);
        setError(`Gagal menginisialisasi blockchain: ${err.message}`);
        setIsReady(true);
        setIsConnected(false);
      }
    };

    // ✅ Small delay untuk memastikan window.ethereum siap
    const timer = setTimeout(initBlockchain, 500);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Listen untuk account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      console.log('[BlockchainContext] Accounts changed:', accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        setError(null);
      } else {
        setAccount(null);
        setIsConnected(false);
        setError('Wallet disconnected');
      }
    };

    const handleChainChanged = (newChainId) => {
      console.log('[BlockchainContext] Chain changed:', newChainId);
      setChainId(Number(newChainId));
      // ✅ Reload untuk memastikan consistency
      window.location.reload();
    };

    const handleDisconnect = (error) => {
      console.log('[BlockchainContext] Wallet disconnected:', error);
      setIsConnected(false);
      setAccount(null);
      setError('Wallet disconnected. Please reconnect.');
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
      window.ethereum?.removeListener('disconnect', handleDisconnect);
    };
  }, []);

  // ✅ Manual reconnect function
  const reconnect = async () => {
    try {
      console.log('[BlockchainContext] Attempting to reconnect...');
      
      if (!window.ethereum) {
        setError('MetaMask tidak terinstall');
        return false;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        setError(null);
        console.log('[BlockchainContext] ✅ Reconnected:', accounts[0]);
        return true;
      }
    } catch (err) {
      console.error('[BlockchainContext] Reconnect failed:', err);
      setError(`Gagal reconnect: ${err.message}`);
      return false;
    }
  };

  // ✅ Get wallet status
  const getWalletStatus = () => {
    return {
      isConnected,
      isReady,
      hasMetaMask: !!window.ethereum,
      account,
      chainId,
      error,
    };
  };

  // ✅ Request wallet connect
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask tidak terinstall. Silakan install terlebih dahulu.');
      return false;
    }

    return reconnect();
  };

  const value = {
    provider,
    signer,
    account,
    isConnected,
    isReady,
    chainId,
    error,
    reconnect,
    connectWallet,
    getWalletStatus,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
}
