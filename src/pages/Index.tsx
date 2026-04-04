import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { deployContract, isOwner, getOwner } from '@/lib/mockBlockchain';
import { Button } from '@/components/ui/button';
import { Shield, Vote, Wallet, Hexagon, ArrowRight } from 'lucide-react';

export default function Index() {
  const { address, connect, isConnecting } = useWallet();
  const navigate = useNavigate();
  const [deployed, setDeployed] = useState(!!getOwner());

  const handleDeploy = async () => {
    const addr = address || (await connect());
    if (addr) {
      deployContract(addr);
      setDeployed(true);
    }
  };

  const owner = getOwner();
  const isAdmin = address ? isOwner(address) : false;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!address ? (
              <Button size="lg" onClick={connect} disabled={isConnecting} className="glow-primary text-lg px-8 py-6">
                <Wallet className="w-5 h-5 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : !deployed ? (
              <Button size="lg" onClick={handleDeploy} className="glow-primary text-lg px-8 py-6">
                <Shield className="w-5 h-5 mr-2" />
                Deploy Contract
              </Button>
            ) : (
              <>
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
              </>
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

      {owner && (
        <div className="border-t border-border py-4 px-6 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Contract deployed • Owner: {owner.slice(0, 6)}...{owner.slice(-4)}
          </p>
        </div>
      )}
    </div>
  );
}
