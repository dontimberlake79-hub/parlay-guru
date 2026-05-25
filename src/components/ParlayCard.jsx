import { Trophy, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import LegItem from './LegItem';

export default function ParlayCard({ parlay, tier }) {
  const [expanded, setExpanded] = useState(false);

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
                {(parlay.legs || []).length} LEG{(parlay.legs || []).length > 1 ? 'S' : ''}
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
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", colors.bar)} style={{ width: `${parlay.winProbability}%` }} />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">{parlay.winProbability}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center mt-2 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-1.5 border-t border-border pt-3">
          {(parlay.legs || []).map((leg, i) => (
            <LegItem key={i} leg={leg} index={i} />
          ))}
          {parlay.reasoning && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed italic">
              💡 {parlay.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}