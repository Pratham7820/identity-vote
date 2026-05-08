import { useEffect, useState } from 'react';
import { getCandidates, getAllVoters, getElection, type Candidate, type Voter, type ElectionConfig } from '@/lib/contractService';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Vote as VoteIcon, CheckCircle2, Activity } from 'lucide-react';

interface Stats {
  totalVoters: number;
  votesCast: number;
  candidates: number;
  turnout: number;
  active: boolean;
  title: string;
}

export function LiveStats({ refreshMs = 5000 }: { refreshMs?: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [voters, cands, election]: [Voter[], Candidate[], ElectionConfig] = await Promise.all([
          getAllVoters(),
          getCandidates(),
          getElection(),
        ]);
        if (!mounted) return;
        const votesCast = voters.filter((v) => v.hasVoted).length;
        setStats({
          totalVoters: voters.length,
          votesCast,
          candidates: cands.length,
          turnout: voters.length > 0 ? (votesCast / voters.length) * 100 : 0,
          active: election.isActive,
          title: election.title,
        });
        setError(false);
      } catch {
        if (mounted) setError(true);
      }
    }
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [refreshMs]);

  if (error || !stats) return null;

  const items = [
    { icon: Users, label: 'Registered Voters', value: stats.totalVoters, color: 'text-primary' },
    { icon: VoteIcon, label: 'Votes Cast', value: stats.votesCast, color: 'text-accent' },
    { icon: CheckCircle2, label: 'Candidates', value: stats.candidates, color: 'text-primary' },
    { icon: Activity, label: 'Turnout', value: `${stats.turnout.toFixed(1)}%`, color: 'text-accent' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {stats.title || 'Live Election Stats'}
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className={`relative flex h-2 w-2`}>
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${stats.active ? 'bg-primary' : 'bg-muted-foreground'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${stats.active ? 'bg-primary' : 'bg-muted-foreground'}`} />
          </span>
          <span className="font-mono text-muted-foreground">{stats.active ? 'LIVE' : 'IDLE'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="glass">
            <CardContent className="p-4 space-y-1">
              <Icon className={`w-5 h-5 ${color}`} />
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {stats.totalVoters > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Live Turnout</span>
            <span className="font-mono">{stats.votesCast} / {stats.totalVoters}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-chain transition-all duration-700"
              style={{ width: `${stats.turnout}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
