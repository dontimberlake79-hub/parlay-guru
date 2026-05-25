import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WinningParlays() {
  const [winners, setWinners] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    base44.entities.ParlayRecord.filter({ result: 'win' }, '-created_date', 20)
      .then(setWinners)
      .catch(() => {});
  }, []);

  if (!winners.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-3.5 h-3.5 text-accent" />
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Winning Pick Slips</h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{winners.length}</span>
      </div>
      <div className="space-y-2">
        {winners.map((parlay) => {
          const isExpanded = expandedId === parlay.id;
          return (
            <div key={parlay.id} className="bg-card border border-primary/30 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : parlay.id)}
                className="w-full p-3.5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">WIN</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">{parlay.sport}</span>
                    </div>
                    <p className="font-display font-bold text-foreground text-sm truncate">{parlay.title}</p>
                    <p className="text-[11px] text-muted-foreground">Went {parlay.legs?.length || 0}/{parlay.legs?.length || 0}</p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
              </button>
              {isExpanded && parlay.legs?.length > 0 && (
                <div className="px-4 pb-3 border-t border-border pt-2.5 space-y-1.5">
                  {parlay.legs.map((leg, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{j + 1}</span>
                      <span className="flex-1 text-foreground">{leg.pick}</span>
                      <span className="text-accent font-bold">{leg.odds}</span>
                    </div>
                  ))}
                  {parlay.reasoning && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border italic leading-relaxed">
                      {parlay.reasoning}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}