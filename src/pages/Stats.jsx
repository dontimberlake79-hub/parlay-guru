import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UFC', 'Other'];

export default function Stats() {
  const [parlays, setParlays] = useState([]);
  const [cappers, setCappers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Parlay.list('-date', 200),
      base44.entities.Capper.list()
    ]).then(([ps, cs]) => {
      setParlays(ps.filter(p => p.published));
      setCappers(cs);
      setLoading(false);
    });
  }, []);

  const graded = parlays.filter(p => ['won', 'lost', 'push'].includes(p.status));
  const wins = parlays.filter(p => p.status === 'won').length;
  const losses = parlays.filter(p => p.status === 'lost').length;
  const pending = parlays.filter(p => p.status === 'pending').length;
  const winRate = graded.length ? Math.round((wins / graded.length) * 100) : 0;

  const bySport = SPORTS.map(sport => ({
    sport,
    wins: parlays.filter(p => p.sport === sport && p.status === 'won').length,
    losses: parlays.filter(p => p.sport === sport && p.status === 'lost').length,
    total: parlays.filter(p => p.sport === sport).length,
  })).filter(s => s.total > 0);

  const byMonth = (() => {
    const map = {};
    parlays.forEach(p => {
      const m = new Date(p.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!map[m]) map[m] = { month: m, wins: 0, losses: 0 };
      if (p.status === 'won') map[m].wins++;
      if (p.status === 'lost') map[m].losses++;
    });
    return Object.values(map).slice(-6);
  })();

  const pieData = wins + losses > 0 ? [
    { name: 'Won', value: wins },
    { name: 'Lost', value: losses },
  ] : [];

  return (
    <div className="min-h-screen font-inter" style={{ background: '#0D0D0D' }}>
      <header className="sticky top-0 z-50 border-b" style={{ background: '#111', borderColor: '#222' }}>
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg text-[#666] hover:text-white transition-all" style={{ background: '#1A1A1A' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display text-white tracking-wider" style={{ fontSize: '18px' }}>Performance Dashboard</h1>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
        {/* Stat blocks */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'WINS', value: wins, color: '#00C853' },
            { label: 'LOSSES', value: losses, color: '#FF3B3B' },
            { label: 'WIN %', value: `${winRate}%`, color: '#00C853' },
            { label: 'PENDING', value: pending, color: '#FFD600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
              <p className="font-mono font-bold" style={{ fontSize: '22px', color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Record display */}
        <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
          <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">All-Time Record</p>
          <p className="font-mono font-bold" style={{ fontSize: '36px', color: '#fff', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#00C853' }}>{wins}W</span>
            <span style={{ color: '#333' }}> – </span>
            <span style={{ color: '#FF3B3B' }}>{losses}L</span>
          </p>
        </div>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Win / Loss Split</p>
            <div className="flex items-center gap-6">
              <PieChart width={90} height={90}>
                <Pie data={pieData} cx={45} cy={45} innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={0}>
                  <Cell fill="#00C853" />
                  <Cell fill="#FF3B3B" />
                </Pie>
              </PieChart>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#00C853' }} />
                  <span className="text-sm font-semibold text-white">{wins} Wins</span>
                  <span className="text-xs text-[#555]">({winRate}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#FF3B3B' }} />
                  <span className="text-sm font-semibold text-white">{losses} Losses</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly bar chart */}
        {byMonth.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Monthly Results</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={byMonth} barSize={10} barGap={2}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#444' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 6, fontSize: 11, color: '#fff' }}
                  cursor={{ fill: '#ffffff08' }}
                />
                <Bar dataKey="wins" fill="#00C853" radius={[3,3,0,0]} name="Wins" />
                <Bar dataKey="losses" fill="#FF3B3B" radius={[3,3,0,0]} name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sport breakdown */}
        {bySport.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">By Sport</p>
            <div className="space-y-3">
              {bySport.map(s => (
                <div key={s.sport}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{s.sport}</span>
                    <span className="font-mono text-xs" style={{ color: '#00C853' }}>{s.wins}W <span style={{ color: '#444' }}>–</span> <span style={{ color: '#FF3B3B' }}>{s.losses}L</span></span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#222' }}>
                    <div className="h-full rounded-full" style={{ width: s.total ? `${(s.wins / s.total) * 100}%` : '0%', background: '#00C853' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cappers */}
        {cappers.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Cappers</p>
            <div className="space-y-2">
              {cappers.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ background: '#222' }}>🎯</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white" style={{ fontSize: '13px' }}>{c.name}</p>
                    <p className="text-[#555]" style={{ fontSize: '11px' }}>{(c.specialties || []).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold" style={{ fontSize: '13px' }}>
                      <span style={{ color: '#00C853' }}>{c.wins}W</span>
                      <span style={{ color: '#444' }}>-</span>
                      <span style={{ color: '#FF3B3B' }}>{c.losses}L</span>
                    </p>
                    <p className="text-[10px] text-[#555]">ROI: {c.roi}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="text-center py-10 text-[#555] text-sm">Loading stats...</div>}
      </main>
    </div>
  );
}