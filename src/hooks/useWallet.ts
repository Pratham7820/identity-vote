import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      // Mock wallet for development
      const mockAddr = '0x' + Math.random().toString(16).slice(2, 42).padEnd(40, '0');
      setAddress(mockAddr);
      localStorage.setItem('mock_wallet', mockAddr);
      return mockAddr;
    }
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      setAddress(accounts[0]);
      return accounts[0];
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem('mock_wallet');
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('mock_wallet');
    if (stored) setAddress(stored);
    
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        const accs = accounts as string[];
        if (accs.length > 0) setAddress(accs[0]);
      });
    }
  }, []);

  return { address, connect, disconnect, isConnecting, hasMetaMask: !!window.ethereum };
}
