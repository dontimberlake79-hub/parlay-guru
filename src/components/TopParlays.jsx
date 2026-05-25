import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, Trophy, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopParlays() {
  const [parlays, setParlays] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [localLikes, setLocalLikes] = useState({});

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    // Fetch top liked parlays (won or pending)
    base44.entities.ParlayRecord.list('-created_date', 100).then(records => {
      const sorted = (records || [])
        .filter(r => r.result !== 'loss')
        .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
        .slice(0, 5);
      setParlays(sorted);
    });
  }, []);

  if (!parlays.length) return null;

  const handleLike = async (e, parlay) => {
    e.stopPropagation();
    const email = currentUser?.email;
    if (!email) return;
    const current = localLikes[parlay.id] ?? parlay.likes ?? [];
    const liked = current.includes(email);
    const updated = liked ? current.filter(x => x !== email) : [...current, email];
    setLocalLikes(prev => ({ ...prev, [parlay.id]: updated }));
    await base44.entities.ParlayRecord.update(parlay.id, { likes: updated });
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-3.5 h-3.5 text-accent" />
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Top Community Picks</h2>
      </div>
      <div className="space-y-2">
        {parlays.map((parlay, i) => {
          const likes = localLikes[parlay.id] ?? parlay.likes ?? [];
          const liked = likes.includes(currentUser?.email);
          const isExpanded = expandedId === parlay.id;
          const isWin = parlay.result === 'win';

          return (
            <div
              key={parlay.id}
              className={cn(
                "border rounded-xl overflow-hidden transition-all",
                i === 0 ? "bg-gradient-to-r from-accent/10 to-primary/10 border-accent/40" : "bg-card border-border"
              )}
            >
              <button onClick={() => setExpandedId(isExpanded ? null : parlay.id)} className="w-full p-3.5 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-lg shrink-0">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {isWin && <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">✓ WINNER</span>}
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">{parlay.sport}</span>
                    </div>
                    <p className="font-display font-bold text-foreground text-sm truncate">{parlay.title}</p>
                    <p className="text-[11px] text-muted-foreground">{parlay.legs?.length || 0} legs · {parlay.totalOdds}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleLike(e, parlay)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-all",
                        liked ? "bg-red-400/15 text-red-400 border-red-400/30" : "text-muted-foreground border-border hover:text-red-400"
                      )}
                    >
                      <Heart className={cn("w-3 h-3", liked && "fill-current")} />
                      {likes.length}
                    </button>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
              </button>
              {isExpanded && parlay.legs?.length > 0 && (
                <div className="px-4 pb-3 border-t border-border pt-2.5 space-y-1.5">
                  {parlay.legs.map((leg, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{j+1}</span>
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