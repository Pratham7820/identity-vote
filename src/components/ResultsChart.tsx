import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Candidate } from '@/lib/contractService';

const COLORS = [
  'hsl(160, 84%, 45%)',
  'hsl(270, 60%, 60%)',
  'hsl(38, 92%, 55%)',
  'hsl(200, 80%, 55%)',
  'hsl(330, 75%, 60%)',
  'hsl(120, 60%, 50%)',
  'hsl(20, 85%, 55%)',
  'hsl(260, 70%, 65%)',
];

interface ResultsChartProps {
  results: Candidate[];
}

export function ResultsChart({ results }: ResultsChartProps) {
  if (results.length === 0) return null;
  const data = results.map((c) => ({
    name: c.name,
    party: c.party,
    votes: c.voteCount,
  }));
  const totalVotes = results.reduce((s, c) => s + c.voteCount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass rounded-xl p-4 space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Vote Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
              />
              <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Vote Share {totalVotes > 0 ? `(${totalVotes} total)` : ''}
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="votes"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={85}
                paddingAngle={2}
                stroke="hsl(var(--background))"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
