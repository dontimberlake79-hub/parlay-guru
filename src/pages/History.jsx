import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trophy, X, Clock, TrendingUp, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatCard({ label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <p className={cn("text-3xl font-bold font-display", color)}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function ParlayRow({ record }) {
  const [open, setOpen] = useState(false);
  const resultColor = record.result === 'win' ? 'text-primary' : record.result === 'loss' ? 'text-red-400' : 'text-muted-foreground';
  const resultIcon = record.result === 'win' ? <Trophy className="w-3.5 h-3.5" /> : record.result === 'loss' ? <X className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />;
  const resultLabel = record.result === 'win' ? 'Hit' : record.result === 'loss' ? 'Miss' : 'Pending';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-all"
      >
        <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", 
          record.result === 'win' ? 'bg-primary/15 text-primary' :
          record.result === 'loss' ? 'bg-red-400/15 text-red-400' :
          'bg-muted text-muted-foreground'
        )}>
          {resultIcon}
          {resultLabel}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{record.title}</p>
          <p className="text-xs text-muted-foreground">{record.sport} · {record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
        </div>
        <span className="text-accent font-bold text-sm flex-shrink-0">{record.totalOdds}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && record.legs?.length > 0 && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
          {record.legs.map((leg, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div>
                <span className="text-foreground font-medium">{leg.pick}</span>
                {leg.matchup && <span className="text-muted-foreground ml-1">· {leg.matchup}</span>}
                {leg.odds && <span className="text-accent font-bold ml-1">{leg.odds}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.entities.ParlayRecord.list('-created_date', 100).then(setRecords).finally(() => setLoading(false));
  }, []);

  const wins = records.filter(r => r.result === 'win').length;
  const losses = records.filter(r => r.result === 'loss').length;
  const pending = records.filter(r => !r.result).length;
  const hitRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  const filtered = filter === 'all' ? records : records.filter(r =>
    filter === 'pending' ? !r.result : r.result === filter
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-[hsl(var(--background))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground leading-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>Pick Slip History</h1>
            </div>
          </div>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary transition-all">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={wins} color="text-primary" />
              <StatCard label="Losses" value={losses} color="text-red-400" />
              <StatCard label="Pending" value={pending} color="text-muted-foreground" />
              <StatCard label="Hit Rate" value={`${hitRate}%`} color="text-accent" />
            </div>

            {wins + losses > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Win Rate</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${hitRate}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{wins} hits out of {wins + losses} settled pick slips</p>
              </div>
            )}

            <div className="flex gap-2">
              {['all', 'win', 'loss', 'pending'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize", 
                    filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'all' ? `All (${records.length})` : f === 'win' ? `Hits (${wins})` : f === 'loss' ? `Misses (${losses})` : `Pending (${pending})`}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No pick slips found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(r => <ParlayRow key={r.id} record={r} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}