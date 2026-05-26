import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Lock, ChevronRight, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPORT_EMOJI = { NFL: '🏈', NBA: '🏀', MLB: '⚾', NHL: '🏒', NCAAF: '🏈', NCAAB: '🏀', MLS: '⚽', UFC: '🥊', Tennis: '🎾', Golf: '⛳', Other: '🎯' };

function StatusBadge({ status }) {
  const map = { won: 'bg-primary/20 text-primary', lost: 'bg-red-400/20 text-red-400', pending: 'bg-muted text-muted-foreground', push: 'bg-blue-400/20 text-blue-400' };
  return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', map[status] || map.pending)}>{status || 'pending'}</span>;
}

function ParlayFeedCard({ parlay, user }) {
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'vip';
  const canView = isPro || parlay.tier === 'free';
  const legs = parlay.legs || [];
  const previewLeg = legs[0];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base">{SPORT_EMOJI[parlay.sport] || '🎯'}</span>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">{parlay.sport}</span>
            <span className="text-[11px] text-muted-foreground">• {legs.length} legs</span>
            {parlay.tier === 'free' && <span className="text-[10px] bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full font-bold">FREE</span>}
            {parlay.tier === 'vip' && <span className="text-[10px] bg-accent/15 text-accent border border-accent/30 px-1.5 py-0.5 rounded-full font-bold">VIP</span>}
          </div>
          <StatusBadge status={parlay.status} />
        </div>

        <h3 className="font-display text-foreground mb-1" style={{ fontSize: '16px', letterSpacing: '0.04em' }}>{parlay.title}</h3>
        <div className="flex items-center gap-1 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <span className="font-display text-accent" style={{ fontSize: '15px', letterSpacing: '0.05em' }}>{parlay.totalOdds}</span>
        </div>

        {previewLeg && (
          <div className="bg-background/60 rounded-lg p-2.5 mb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Leg 1 — {previewLeg.betType || 'Pick'}</p>
                <p className="text-foreground font-semibold truncate" style={{ fontSize: '13px' }}>{previewLeg.pick}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>{previewLeg.game}</p>
              </div>
              <span className="font-display text-foreground shrink-0" style={{ fontSize: '14px' }}>{previewLeg.odds}</span>
            </div>
          </div>
        )}

        {legs.length > 1 && (
          canView ? (
            <div className="space-y-1.5">
              {legs.slice(1).map((leg, i) => (
                <div key={i} className="bg-background/60 rounded-lg p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Leg {i + 2} — {leg.betType || 'Pick'}</p>
                      <p className="text-foreground font-semibold truncate" style={{ fontSize: '13px' }}>{leg.pick}</p>
                      <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>{leg.game}</p>
                    </div>
                    <span className="font-display text-foreground shrink-0" style={{ fontSize: '14px' }}>{leg.odds}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="bg-background/60 rounded-lg p-2.5 blur-sm select-none">
                <p className="text-foreground font-semibold" style={{ fontSize: '13px' }}>Leg 2 — Premium Pick</p>
                <p className="text-muted-foreground" style={{ fontSize: '11px' }}>+{legs.length - 1} more legs hidden</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Link to="/pricing" className="flex items-center gap-1.5 bg-accent text-accent-foreground font-bold px-3 py-1.5 rounded-lg text-xs shadow-lg hover:bg-accent/90 transition-all">
                  <Lock className="w-3 h-3" />
                  Unlock Full Slip — Pro
                </Link>
              </div>
            </div>
          )
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground">{new Date(parlay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <Link to={`/parlay/${parlay.id}`} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-all">
            Full breakdown <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const [parlays, setParlays] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');

  useEffect(() => {
    const init = async () => {
      try { setUser(await base44.auth.me()); } catch (_) {}
      const all = await base44.entities.Parlay.list('-publishedAt', 50);
      setParlays(all.filter(p => p.published));
      setLoading(false);
    };
    init();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const filtered = filter === 'today'
    ? parlays.filter(p => p.date?.startsWith(today))
    : parlays;

  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'vip';
  const wins = parlays.filter(p => p.status === 'won').length;
  const losses = parlays.filter(p => p.status === 'lost').length;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display" style={{ fontSize: '22px', letterSpacing: '0.05em', color: '#FFD700' }}>The Parlay Guru</h1>
            <p className="text-[10px] text-muted-foreground">Expert Daily Picks</p>
          </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <Link to="/pricing" className="bg-accent text-accent-foreground font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-all">
                Go Pro
              </Link>
            )}
            {isPro && (
              <span className="text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 px-2 py-1 rounded-full uppercase">
                {user?.subscription_tier?.toUpperCase()}
              </span>
            )}
            <Link to="/history" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-secondary/50 border border-border/50 transition-all">History</Link>
            <Link to="/stats" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-secondary/50 border border-border/50 transition-all">Stats</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Record', value: `${wins}-${losses}`, color: 'text-primary' },
            { label: 'Win %', value: winRate > 0 ? winRate + '%' : '--', color: 'text-accent' },
            { label: 'Picks', value: parlays.length, color: 'text-foreground' },
            { label: 'Pending', value: parlays.filter(p => p.status === 'pending').length, color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-2 text-center">
              <p className={cn('font-display font-bold', s.color)} style={{ fontSize: '16px' }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {['today', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {f === 'today' ? "Today's Picks" : 'All Picks'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-card animate-pulse border border-border" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-display text-foreground" style={{ fontSize: '18px' }}>No picks yet today</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon — picks drop daily</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => <ParlayFeedCard key={p.id} parlay={p} user={user} />)}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-2 pb-6 flex-wrap">
          <Link to="/referrals" className="text-[11px] text-muted-foreground hover:text-accent transition-all">🎁 Refer and Earn</Link>
          <Link to="/notifications" className="text-[11px] text-muted-foreground hover:text-accent transition-all">🔔 Notifications</Link>
          <Link to="/generator" className="text-[11px] text-muted-foreground hover:text-accent transition-all">🤖 AI Generator</Link>
          {user?.role === 'admin' && <Link to="/admin" className="text-[11px] text-muted-foreground hover:text-primary transition-all">⚙️ Admin</Link>}
        </div>
      </main>
    </div>
  );
}