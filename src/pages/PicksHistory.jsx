import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPORT_EMOJI = { NFL: '🏈', NBA: '🏀', MLB: '⚾', NHL: '🏒', NCAAF: '🏈', NCAAB: '🏀', MLS: '⚽', UFC: '🥊', Tennis: '🎾', Golf: '⛳', Other: '🎯' };
const SPORTS = ['All', 'NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UFC', 'Tennis', 'Golf'];
const RESULTS = ['All', 'won', 'lost', 'pending', 'push'];

function ResultBadge({ status }) {
  const map = { won: 'bg-primary/20 text-primary', lost: 'bg-red-400/20 text-red-400', pending: 'bg-muted text-muted-foreground', push: 'bg-blue-400/20 text-blue-400' };
  return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', map[status] || map.pending)}>{status || 'pending'}</span>;
}

export default function PicksHistory() {
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');

  useEffect(() => {
    const init = async () => {
      const all = await base44.entities.Parlay.list('-date', 200);
      setParlays(all.filter(p => p.published));
      setLoading(false);
    };
    init();
  }, []);

  const filtered = parlays.filter(p => {
    if (sportFilter !== 'All' && p.sport !== sportFilter) return false;
    if (resultFilter !== 'All' && (p.status || 'pending') !== resultFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display flex-1" style={{ fontSize: '18px', letterSpacing: '0.04em' }}>Picks History</h1>
          <span className="text-[11px] text-muted-foreground">{filtered.length} picks</span>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Sport</p>
            <div className="flex gap-1.5 flex-wrap">
              {SPORTS.map(s => (
                <button key={s} onClick={() => setSportFilter(s)}
                  className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all',
                    sportFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Result</p>
            <div className="flex gap-1.5 flex-wrap">
              {RESULTS.map(r => (
                <button key={r} onClick={() => setResultFilter(r)}
                  className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all capitalize',
                    resultFilter === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-card animate-pulse border border-border" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No picks match your filters.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <Link to={`/parlay/${p.id}`} key={p.id}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-muted-foreground/30 transition-all">
                <span className="text-xl">{SPORT_EMOJI[p.sport] || '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate" style={{ fontSize: '13px' }}>{p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-[10px] text-muted-foreground">• {(p.legs || []).length} legs</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-accent" style={{ fontSize: '14px' }}>{p.totalOdds}</p>
                  <ResultBadge status={p.status} />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}