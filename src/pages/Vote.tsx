import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import {
  getVoter,
  getCandidates,
  castVote,
  isElectionActive,
  getElection,
  getResults,
  type Candidate,
  type Voter,
  type ElectionConfig,
} from '@/lib/contractService';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'connect' | 'verify-face' | 'vote' | 'done' | 'error';

export default function VotePage() {
  const { address, connect } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('connect');
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [voter, setVoter] = useState<Voter | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [election, setElectionState] = useState<ElectionConfig | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);

  // Load election data
  useEffect(() => {
    async function load() {
      try {
        const [e, a, c] = await Promise.all([
          getElection(),
          isElectionActive(),
          getCandidates(),
        ]);
        setElectionState(e);
        setActive(a);
        setCandidates(c);
      } catch (err) {
        console.error('Failed to load election data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleConnect = async () => {
    const addr = await connect();
    if (!addr) return;
    setLoading(true);
    try {
      const v = await getVoter(addr);
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
      setVoter(v);
      setStep('verify-face');
    } catch (err) {
      setErrorMsg('Failed to verify registration on-chain.');
      setStep('error');
    } finally {
      setLoading(false);
    }
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

  const handleVote = async () => {
    if (selectedCandidate === null) return;
    setVoting(true);
    try {
      await castVote(selectedCandidate);
      const r = await getResults();
      setResults(r);
      setStep('done');
      toast.success('Vote cast successfully on-chain!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      toast.error(message);
    } finally {
      setVoting(false);
    }
  };

  const totalVotes = results.reduce((s, c) => s + c.voteCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Voting Booth</h1>
            {election?.title && <p className="text-xs text-muted-foreground">{election.title}</p>}
          </div>
        </div>

        {step === 'connect' && (
          <Card className="glass">
            <CardContent className="p-8 text-center space-y-6">
              <Wallet className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Step 1: Connect Your Wallet</h2>
              <p className="text-muted-foreground">Connect the MetaMask wallet registered by the admin to begin voting</p>
              {!active && (
                <div className="flex items-center gap-2 justify-center text-destructive text-sm">
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
                Verify your identity by capturing your face. It will be compared against your on-chain registration data.
              </p>
              <FaceCapture onCapture={handleFaceVerify} mode="verify" />
            </CardContent>
          </Card>
        )}

        {step === 'vote' && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary" />
                Step 3: Cast Your Vote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-sm">Select your candidate and confirm. This sends an irreversible transaction.</p>
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
              <Button onClick={handleVote} className="w-full glow-primary" size="lg" disabled={selectedCandidate === null || voting}>
                {voting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Vote className="w-5 h-5 mr-2" />}
                {voting ? 'Submitting Transaction...' : 'Confirm Vote'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <Card className="glass">
            <CardContent className="p-8 text-center space-y-6">
              <CheckCircle className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Vote Cast Successfully!</h2>
              <p className="text-muted-foreground text-sm">
                Your vote has been recorded on the Ethereum blockchain. Thank you for participating.
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
