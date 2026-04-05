import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import {
  isOwner,
  getOwner,
  setElection,
  getElection,
  addCandidate,
  removeCandidate,
  getCandidates,
  registerVoter,
  getAllVoters,
  getResults,
  type Candidate,
  type Voter,
  type ElectionConfig,
} from '@/lib/contractService';
import { FaceCapture } from '@/components/FaceCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Calendar,
  BarChart3,
  UserPlus,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { address, connect } = useWallet();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!address) {
        setChecking(false);
        return;
      }
      try {
        const admin = await isOwner(address);
        setAuthorized(admin);
      } catch {
        setAuthorized(false);
      } finally {
        setChecking(false);
      }
    }
    checkAccess();
  }, [address]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Admin Access Required</h2>
            <p className="text-muted-foreground text-sm">Connect the contract owner wallet to access admin panel</p>
            <Button onClick={connect} className="glow-primary">Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground text-sm">Only the contract deployer can access admin functions</p>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
          </div>
        </div>

        <Tabs defaultValue="election" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="election"><Calendar className="w-4 h-4 mr-1" />Election</TabsTrigger>
            <TabsTrigger value="candidates"><Users className="w-4 h-4 mr-1" />Candidates</TabsTrigger>
            <TabsTrigger value="voters"><UserPlus className="w-4 h-4 mr-1" />Register Voters</TabsTrigger>
            <TabsTrigger value="results"><BarChart3 className="w-4 h-4 mr-1" />Results</TabsTrigger>
          </TabsList>

          <TabsContent value="election"><ElectionSetup /></TabsContent>
          <TabsContent value="candidates"><CandidateManager /></TabsContent>
          <TabsContent value="voters"><VoterRegistration /></TabsContent>
          <TabsContent value="results"><ResultsView /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ElectionSetup() {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const e = await getElection();
        setTitle(e.title);
        setIsActive(e.isActive);
        if (e.startTime > 0) {
          setStartDate(new Date(e.startTime * 1000).toISOString().slice(0, 16));
          setEndDate(new Date(e.endTime * 1000).toISOString().slice(0, 16));
        }
      } catch (err) {
        console.error('Failed to load election:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const save = async () => {
    if (!title || !startDate || !endDate) {
      toast.error('Fill all fields');
      return;
    }
    setSaving(true);
    try {
      const config: ElectionConfig = {
        title,
        startTime: Math.floor(new Date(startDate).getTime() / 1000),
        endTime: Math.floor(new Date(endDate).getTime() / 1000),
        isActive,
      };
      await setElection(config);
      toast.success('Election configuration saved on-chain!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Election Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Election Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="General Election 2026" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date & Time</Label>
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date & Time</Label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          <span className="text-sm">Election Active</span>
        </label>
        <Button onClick={save} className="glow-primary" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? 'Sending Transaction...' : 'Save Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}

function CandidateManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    try {
      const c = await getCandidates();
      setCandidates(c);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async () => {
    if (!name || !party) { toast.error('Fill name and party'); return; }
    setAdding(true);
    try {
      await addCandidate(name, party);
      await loadCandidates();
      setName('');
      setParty('');
      toast.success(`Candidate "${name}" added on-chain!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeCandidate(id);
      await loadCandidates();
      toast.success('Candidate removed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      toast.error(message);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Manage Candidates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Input placeholder="Candidate name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Party" value={party} onChange={(e) => setParty(e.target.value)} />
          <Button onClick={handleAdd} className="glow-primary shrink-0" disabled={adding}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
        <div className="space-y-2">
          {candidates.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No candidates added yet</p>}
          {candidates.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground text-sm ml-2">({c.party})</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VoterRegistration() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [form, setForm] = useState({ name: '', age: '', walletAddress: '' });
  const [faceData, setFaceData] = useState<number[] | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadVoters();
  }, []);

  async function loadVoters() {
    try {
      const v = await getAllVoters();
      setVoters(v);
    } catch (err) {
      console.error('Failed to load voters:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRegister = async () => {
    if (!form.name || !form.age || !form.walletAddress) { toast.error('Fill all fields'); return; }
    if (!faceData) { toast.error('Face capture required'); return; }
    if (parseInt(form.age) < 18) { toast.error('Voter must be 18+'); return; }

    setRegistering(true);
    try {
      await registerVoter(form.walletAddress, form.name, parseInt(form.age), faceData);
      await loadVoters();
      setForm({ name: '', age: '', walletAddress: '' });
      setFaceData(null);
      setShowCamera(false);
      toast.success(`Voter "${form.name}" registered on-chain!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Register Voters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input type="number" min={18} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="18" />
            </div>
            <div className="space-y-2">
              <Label>MetaMask Wallet Address</Label>
              <Input value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="0x..." className="font-mono text-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Face Data</Label>
            {!showCamera && !faceData && (
              <Button variant="outline" onClick={() => setShowCamera(true)} className="w-full h-32 border-dashed border-primary/30">
                Click to capture face data
              </Button>
            )}
            {showCamera && !faceData && (
              <FaceCapture onCapture={(d) => { setFaceData(d); setShowCamera(false); }} mode="register" />
            )}
            {faceData && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center space-y-2">
                <p className="text-primary text-sm font-medium">✓ Face data captured ({faceData.length} features)</p>
                <Button variant="ghost" size="sm" onClick={() => { setFaceData(null); setShowCamera(true); }}>Recapture</Button>
              </div>
            )}
          </div>
        </div>
        <Button onClick={handleRegister} className="w-full glow-primary" disabled={!faceData || registering}>
          {registering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {registering ? 'Sending Transaction...' : 'Register Voter'}
        </Button>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold mb-3">Registered Voters ({voters.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {voters.map((v) => (
              <div key={v.walletAddress} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border text-sm">
                <div>
                  <span className="font-medium">{v.name}</span>
                  <span className="text-muted-foreground ml-2">Age: {v.age}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{v.walletAddress.slice(0, 8)}...{v.walletAddress.slice(-4)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsView() {
  const [results, setResults] = useState<Candidate[]>([]);
  const [election, setElectionState] = useState<ElectionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [r, e] = await Promise.all([getResults(), getElection()]);
        setResults(r);
        setElectionState(e);
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalVotes = results.reduce((s, c) => s + c.voteCount, 0);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Election Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {election?.title && (
          <p className="text-muted-foreground text-sm">{election.title} • Total votes: {totalVotes}</p>
        )}
        {results.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No candidates registered yet</p>}
        <div className="space-y-3">
          {results.map((c, i) => {
            const pct = totalVotes > 0 ? (c.voteCount / totalVotes) * 100 : 0;
            return (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {i === 0 && totalVotes > 0 && '🏆 '}{c.name} <span className="text-muted-foreground">({c.party})</span>
                  </span>
                  <span className="font-mono">{c.voteCount} votes ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full gradient-chain transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
