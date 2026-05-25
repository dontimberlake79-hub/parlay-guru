import { Trophy, TrendingUp, ChevronDown, ChevronUp, Share2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import LegItem from './LegItem';
import ShareablePickCard from './ShareablePickCard';

export default function ParlayCard({ parlay, tier, isDailyPick = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [revealedLegs, setRevealedLegs] = useState(0);
  
  console.log('ParlayCard received:', parlay);

  useEffect(() => {
    if (expanded && parlay.legs?.length > 0) {
      setRevealedLegs(0);
      parlay.legs.forEach((_, i) => {
        setTimeout(() => setRevealedLegs(i + 1), (i + 1) * 150);
      });
    }
  }, [expanded, parlay.legs?.length]);

  const tierColors = {
    safe: { badge: 'bg-primary/15 text-primary border-primary/30', bar: 'bg-primary' },
    moderate: { badge: 'bg-blue-400/15 text-blue-400 border-blue-400/30', bar: 'bg-blue-400' },
    risky: { badge: 'bg-accent/15 text-accent border-accent/30', bar: 'bg-accent' },
    extreme: { badge: 'bg-red-400/15 text-red-400 border-red-400/30', bar: 'bg-red-400' },
  };

  const colors = tierColors[tier] || tierColors.safe;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:border-muted-foreground/30">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", colors.badge)}>
                {(parlay.legs || []).length} PICK{(parlay.legs || []).length > 1 ? 'S' : ''}
              </span>
              <span className="text-xs text-muted-foreground">{parlay.sport}</span>
            </div>
            <p className="font-display font-bold text-foreground text-base truncate">{parlay.title}</p>
          </div>
          <div className="text-right shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-accent" />
            <span className="font-display font-bold text-accent text-lg">{parlay.totalOdds}</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", colors.bar)} style={{ width: `${parlay.winProbability}%` }} />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">{parlay.winProbability}%</span>
          </div>
          {parlay.valueRating && (
            <div className="flex items-center justify-end gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3 h-3",
                    star <= parlay.valueRating
                      ? "fill-accent text-accent"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
          )}
          </div>
        </div>
        <div className="flex items-center justify-center mt-2 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {!isDailyPick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowShare(true);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}
      {expanded && (
        <div className="px-4 pb-4 space-y-1.5 border-t border-border pt-3">
          {parlay.legs && parlay.legs.length > 0 ? (
            parlay.legs.map((leg, i) => (
              <div
                key={i}
                className="animate-in fade-in zoom-in duration-300"
                style={{
                  animationDelay: `${i * 150}ms`,
                  opacity: i < revealedLegs ? 1 : 0,
                  transform: i < revealedLegs ? 'scale(1)' : 'scale(0.95)'
                }}
              >
                <LegItem leg={leg} index={i} />
                {leg.legReason && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1 ml-1 italic">
                    → {leg.legReason}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-2">No legs data available</p>
          )}
          {parlay.reasoning && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Why This Parlay?</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                💡 {parlay.reasoning}
              </p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/60 mt-3 pt-2 border-t border-border leading-relaxed">
            ⚠️ AI-generated suggestion for entertainment purposes only. We do not accept bets or guarantee results. Please gamble responsibly.
          </p>
        </div>
      )}
      <ShareablePickCard
        parlay={parlay}
        tier={tier}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  );
}