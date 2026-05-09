import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import type { Candidate } from '@/lib/contractService';
import { getPartySymbol } from '@/lib/parties';

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
    logo: getPartySymbol(c.party),
  }));

  const totalVotes = results.reduce((s, c) => s + c.voteCount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* BAR CHART */}
      <div className="glass rounded-xl p-4 space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Vote Distribution
        </h4>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}
                itemStyle={{
                  color: 'white',
                }}
                labelStyle={{
                  color: 'white',
                }}
                cursor={{
                  fill: 'hsl(var(--primary) / 0.08)',
                }}
              />

              <Bar
                dataKey="votes"
                radius={[6, 6, 0, 0]}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CUSTOM LEGEND */}
        <div className="flex flex-wrap gap-3">
          {data.map((item, i) => (
            <div
              key={item.party}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />

              <img
                src={item.logo}
                alt={item.party}
                className="w-4 h-4 object-contain"
              />

              <span className="text-white">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PIE CHART */}
      <div className="glass rounded-xl p-4 space-y-4">
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
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}
                itemStyle={{
                  color: 'white',
                }}
                labelStyle={{
                  color: 'white',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* CUSTOM LEGEND */}
        <div className="flex flex-wrap gap-3">
          {data.map((item, i) => (
            <div
              key={item.party}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />

              <img
                src={item.logo}
                alt={item.party}
                className="w-4 h-4 object-contain"
              />

              <span className="text-white">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}