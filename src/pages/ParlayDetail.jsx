import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Share2, Check, Lock, Trophy, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

const SPORT_EMOJI = { NFL: '🏈', NBA: '🏀', MLB: '⚾', NHL: '🏒', NCAAF: '🏈', NCAAB: '🏀', MLS: '⚽', UFC: '🥊', Tennis: '🎾', Golf: '⛳', Other: '🎯' };

function ResultBadge({ result }) {
  if (result === 'won') return <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> WON</span>;
  if (result === 'lost') return <span className="flex items-center gap-1 text-[10px] font-bold bg-red-400/20 text-red-400 px-2 py-0.5 rounded-full"><X className="w-3 h-3" /> LOST</span>;
  if (result === 'push') return <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-400/20 text-blue-400 px-2 py-0.5 rounded-full"><Minus className="w-3 h-3" /> PUSH</span>;
  return <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">PENDING</span>;
}

export default function ParlayDetail() {
  const { id } = useParams();
  const [parlay, setParlay] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try { setUser(await base44.auth.me()); } catch (_) {}
      const p = await base44.entities.Parlay.get(id);
      setParlay(p);
      setLoading(false);
    };
    init();
  }, [id]);

  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'vip';
  const canView = isPro || parlay?.tier === 'free';

  const shareCard = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0a', scale: 2 });
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `parlay-${parlay.title}.png`;
    link.href = url;
    link.click();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!parlay) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Parlay not found</p>
    </div>
  );

  const legs = parlay.legs || [];
  const statusColors = { won: 'border-primary/40 bg-primary/5', lost: 'border-red-400/40 bg-red-400/5', pending: 'border-border bg-card', push: 'border-blue-400/40 bg-blue-400/5' };

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display flex-1 truncate" style={{ fontSize: '16px', letterSpacing: '0.04em' }}>{parlay.title}</h1>
          <button onClick={copyLink} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
        {/* Parlay header card */}
        <div ref={cardRef} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{SPORT_EMOJI[parlay.sport] || '🎯'}</span>
            <div>
              <h2 className="font-display text-foreground" style={{ fontSize: '20px', letterSpacing: '0.04em' }}>{parlay.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{parlay.sport} • {legs.length} legs • {new Date(parlay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Total Odds</p>
              <p className="font-display text-accent" style={{ fontSize: '28px', letterSpacing: '0.05em' }}>{parlay.totalOdds}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Status</p>
              <ResultBadge result={parlay.status} />
            </div>
          </div>
        </div>

        {/* Legs */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Pick Legs</h3>
          <div className="space-y-2">
            {legs.map((leg, i) => {
              const locked = !canView && i > 0;
              return (
                <div key={i} className={cn('rounded-xl border p-3', statusColors[leg.result] || statusColors.pending, locked && 'opacity-60')}>
                  {locked ? (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-muted-foreground" style={{ fontSize: '13px' }}>Leg {i + 1} — Locked</p>
                        <p className="text-muted-foreground/60" style={{ fontSize: '11px' }}>Upgrade to Pro to unlock</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Leg {i + 1}</span>
                            {leg.betType && <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">{leg.betType}</span>}
                          </div>
                          <p className="font-semibold text-foreground" style={{ fontSize: '14px' }}>{leg.pick}</p>
                          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{leg.game}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-foreground" style={{ fontSize: '16px', letterSpacing: '0.05em' }}>{leg.odds}</p>
                          <ResultBadge result={leg.result} />
                        </div>
                      </div>
                      {leg.reasoning && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Analysis</p>
                          <p className="text-muted-foreground leading-relaxed italic" style={{ fontSize: '12px' }}>💡 {leg.reasoning}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!canView && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-center">
            <Lock className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="font-display text-foreground mb-1" style={{ fontSize: '18px' }}>Unlock Full Slip</p>
            <p className="text-muted-foreground text-sm mb-3">Get full legs, analysis, and reasoning with Pro.</p>
            <Link to="/pricing" className="inline-block bg-accent text-accent-foreground font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-accent/90 transition-all">
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {canView && (
          <button onClick={shareCard} className="w-full flex items-center justify-center gap-2 bg-secondary border border-border text-foreground font-semibold text-sm py-3 rounded-xl hover:bg-secondary/80 transition-all">
            <Share2 className="w-4 h-4" /> Share as Image
          </button>
        )}

        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </Link>
      </main>
    </div>
  );
}