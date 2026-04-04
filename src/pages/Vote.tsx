import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import {
  getVoter,
  getCandidates,
  castVote,
  isElectionActive,
  getElection,
  getResults,
} from '@/lib/mockBlockchain';
import { compareFaces } from '@/lib/faceRecognition';
import { FaceCapture } from '@/components/FaceCapture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Vote,
  Wallet,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'connect' | 'verify-face' | 'vote' | 'done' | 'error';

export default function VotePage() {
  const { address, connect } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('connect');
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const election = getElection();
  const active = isElectionActive();
  const voter = address ? getVoter(address) : null;
  const candidates = getCandidates();

  const handleConnect = async () => {
    const addr = await connect();
    if (!addr) return;
    const v = getVoter(addr);
    if (!v) {
      setErrorMsg('Your wallet is not registered as a voter.');
      setStep('error');
      return;
    }
    if (v.hasVoted) {
      setErrorMsg('You have already cast your vote.');
      setStep('error');
      return;
    }
    if (!active) {
      setErrorMsg('Election is not currently active.');
      setStep('error');
      return;
    }
    setStep('verify-face');
  };

  const handleFaceVerify = useCallback(
    (descriptor: number[]) => {
      if (!voter?.faceDescriptor) {
        toast.error('No face data found for your registration');
        return;
      }
      const match = compareFaces(descriptor, voter.faceDescriptor);
      if (match) {
        toast.success('Identity verified!');
        setStep('vote');
      } else {
        toast.error('Face does not match registration. Try again.');
      }
    },
    [voter]
  );

  const handleVote = () => {
    if (!address || selectedCandidate === null) return;
    const success = castVote(address, selectedCandidate);
    if (success) {
      setStep('done');
      toast.success('Vote cast successfully on-chain!');
    } else {
      toast.error('Failed to cast vote');
    }
  };

  const results = getResults();
  const totalVotes = results.reduce((s, c) => s + c.voteCount, 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Voting Booth</h1>
            {election.title && <p className="text-xs text-muted-foreground">{election.title}</p>}
          </div>
        </div>

        {/* Step: Connect Wallet */}
        {step === 'connect' && (
          <Card className="glass">
            <CardContent className="p-8 text-center space-y-6">
              <Wallet className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Step 1: Connect Your Wallet</h2>
              <p className="text-muted-foreground">Connect the MetaMask wallet registered by the admin to begin voting</p>
              {!active && (
                <div className="flex items-center gap-2 justify-center text-warning text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Election is not currently active
                </div>
              )}
              <Button onClick={handleConnect} className="glow-primary" size="lg" disabled={!active}>
                <Wallet className="w-5 h-5 mr-2" />
                Connect & Verify Registration
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Face Verification */}
        {step === 'verify-face' && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Step 2: Face Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Verify your identity by capturing your face. It will be compared against your registration data.
              </p>
              <FaceCapture onCapture={handleFaceVerify} mode="verify" />
            </CardContent>
          </Card>
        )}

        {/* Step: Cast Vote */}
        {step === 'vote' && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary" />
                Step 3: Cast Your Vote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-sm">Select your candidate and confirm your vote. This action is irreversible.</p>
              <div className="space-y-3">
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCandidate(c.id)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      selectedCandidate === c.id
                        ? 'border-primary bg-primary/10 glow-primary'
                        : 'border-border bg-secondary/30 hover:border-primary/50'
                    }`}
                  >
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">({c.party})</span>
                  </button>
                ))}
              </div>
              <Button onClick={handleVote} className="w-full glow-primary" size="lg" disabled={selectedCandidate === null}>
                <Vote className="w-5 h-5 mr-2" />
                Confirm Vote
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <Card className="glass">
            <CardContent className="p-8 text-center space-y-6">
              <CheckCircle className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Vote Cast Successfully!</h2>
              <p className="text-muted-foreground text-sm">
                Your vote has been recorded on the blockchain. Thank you for participating.
              </p>
              <div className="space-y-3 text-left">
                <h3 className="text-sm font-semibold text-center">Live Results</h3>
                {results.map((c) => {
                  const pct = totalVotes > 0 ? (c.voteCount / totalVotes) * 100 : 0;
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{c.name}</span>
                        <span className="font-mono">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full gradient-chain" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {step === 'error' && (
          <Card className="glass">
            <CardContent className="p-8 text-center space-y-4">
              <XCircle className="w-16 h-16 mx-auto text-destructive" />
              <h2 className="text-xl font-bold">Cannot Vote</h2>
              <p className="text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
