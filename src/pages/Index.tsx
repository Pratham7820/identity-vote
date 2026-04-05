import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import {
  getContractAddress,
  setContractAddress,
  getOwner,
  isOwner,
} from '@/lib/contractService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Vote, Wallet, Hexagon, ArrowRight, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const { address, connect, isConnecting } = useWallet();
  const navigate = useNavigate();
  const [contractAddr, setContractAddr] = useState(getContractAddress() || '');
  const [isConnected, setIsConnected] = useState(!!getContractAddress());
  const [isAdmin, setIsAdmin] = useState(false);
  const [owner, setOwner] = useState<string | null>(null);
  const [inputAddr, setInputAddr] = useState('');

  // Check ownership when address or contract changes
  useEffect(() => {
    async function check() {
      if (!isConnected || !address) {
        setIsAdmin(false);
        return;
      }
      try {
        const admin = await isOwner(address);
        setIsAdmin(admin);
        const o = await getOwner();
        setOwner(o);
      } catch {
        setIsAdmin(false);
      }
    }
    check();
  }, [address, isConnected]);

  const handleConnectContract = () => {
    if (!inputAddr || !inputAddr.startsWith('0x')) {
      toast.error('Enter a valid contract address');
      return;
    }
    setContractAddress(inputAddr);
    setContractAddr(inputAddr);
    setIsConnected(true);
    toast.success('Contract connected!');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm text-muted-foreground">
            <Hexagon className="w-4 h-4 text-primary" />
            Powered by Ethereum Smart Contracts
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            <span className="glow-text text-primary">Secure</span> E-Voting
            <br />
            <span className="text-foreground">on the Blockchain</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Transparent, tamper-proof elections with face recognition authentication
            and decentralized vote storage on Ethereum.
          </p>

          <div className="flex flex-col gap-4 items-center">
            {/* Step 1: Connect wallet */}
            {!address ? (
              <Button size="lg" onClick={connect} disabled={isConnecting} className="glow-primary text-lg px-8 py-6">
                <Wallet className="w-5 h-5 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : !isConnected ? (
              /* Step 2: Connect to deployed contract */
              <div className="space-y-4 w-full max-w-md">
                <div className="space-y-2 text-left">
                  <Label>Contract Address (deployed via Forge)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={inputAddr}
                      onChange={(e) => setInputAddr(e.target.value)}
                      placeholder="0x..."
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleConnectContract} className="glow-primary shrink-0">
                      <Link2 className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deploy the contract with Forge first, then paste the address here.
                </p>
              </div>
            ) : (
              /* Step 3: Navigate */
              <div className="flex flex-col sm:flex-row gap-4">
                {isAdmin && (
                  <Button size="lg" onClick={() => navigate('/admin')} className="glow-primary text-lg px-8 py-6">
                    <Shield className="w-5 h-5 mr-2" />
                    Admin Panel
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={() => navigate('/vote')} className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10">
                  <Vote className="w-5 h-5 mr-2" />
                  Cast Vote
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {address && (
            <p className="text-xs text-muted-foreground font-mono">
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
              {isAdmin && <span className="ml-2 text-primary">(Contract Owner)</span>}
            </p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-border py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Tamper-Proof', desc: 'Votes stored on Ethereum blockchain, immutable and verifiable' },
            { icon: Vote, title: 'One Person One Vote', desc: 'Smart contract enforces single vote per registered wallet' },
            { icon: Wallet, title: 'Face + Wallet Auth', desc: 'Dual authentication with face recognition and MetaMask' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-xl p-6 space-y-3">
              <Icon className="w-8 h-8 text-primary" />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {isConnected && (
        <div className="border-t border-border py-4 px-6 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Contract: {contractAddr.slice(0, 10)}...{contractAddr.slice(-6)}
            {owner && <> • Owner: {owner.slice(0, 6)}...{owner.slice(-4)}</>}
          </p>
        </div>
      )}
    </div>
  );
}
