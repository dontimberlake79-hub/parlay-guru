import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UFC', 'Other'];

export default function Stats() {
  const [parlays, setParlays] = useState([]);
  const [cappers, setCappers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [ps, cs] = await Promise.all([
        base44.entities.Parlay.list('-date', 200),
        base44.entities.Capper.list()
      ]);
      setParlays(ps.filter(p => p.published));
      setCappers(cs);
      setLoading(false);
    };
    init();
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
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display" style={{ fontSize: '18px', letterSpacing: '0.04em' }}>Record and Stats</h1>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'All-Time Record', value: `${wins}W - ${losses}L`, color: 'text-primary' },
            { label: 'Win Rate', value: `${winRate}%`, color: 'text-accent' },
            { label: 'Total Published', value: parlays.length, color: 'text-foreground' },
            { label: 'Pending', value: pending, color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3">
              <p className={cn('font-display font-bold', s.color)} style={{ fontSize: '22px' }}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {pieData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Win / Loss Split</h3>
            <div className="flex items-center gap-4">
              <PieChart width={100} height={100}>
                <Pie data={pieData} cx={50} cy={50} innerRadius={30} outerRadius={48} dataKey="value">
                  <Cell fill="hsl(142,72%,50%)" />
                  <Cell fill="hsl(0,84%,60%)" />
                </Pie>
              </PieChart>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-foreground font-semibold">{wins} Wins ({winRate}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm text-foreground font-semibold">{losses} Losses</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {byMonth.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Monthly Breakdown</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={byMonth} barSize={12}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(215,14%,50%)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="wins" fill="hsl(142,72%,50%)" radius={[4,4,0,0]} name="Wins" />
                <Bar dataKey="losses" fill="hsl(0,84%,60%)" radius={[4,4,0,0]} name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {bySport.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">By Sport</h3>
            <div className="space-y-2">
              {bySport.map(s => (
                <div key={s.sport} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-14">{s.sport}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: s.total ? `${(s.wins / s.total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground w-10 text-right">{s.wins}-{s.losses}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {cappers.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Cappers</h3>
            <div className="space-y-2">
              {cappers.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">🎯</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground" style={{ fontSize: '14px' }}>{c.name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{(c.specialties || []).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-primary" style={{ fontSize: '16px' }}>{c.wins}W-{c.losses}L</p>
                    <p className="text-[10px] text-muted-foreground">ROI: {c.roi}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="text-center py-10 text-muted-foreground text-sm">Loading stats...</div>}
      </main>
    </div>
  );
}