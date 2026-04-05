import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
    }
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        return accounts[0];
      }
      return null;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      const accs = accounts as string[];
      if (accs.length > 0) setAddress(accs[0]);
    });

    // Listen for account changes
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setAddress(null);
      } else {
        setAddress(accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  return {
    address,
    connect,
    disconnect,
    isConnecting,
    hasMetaMask: typeof window !== 'undefined' && !!window.ethereum,
  };
}
