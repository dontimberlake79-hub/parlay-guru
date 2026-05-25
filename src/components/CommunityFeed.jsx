import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function CommunityParlayCard({ parlay, currentUserEmail }) {
  const [expanded, setExpanded] = useState(false);
  const liked = parlay.likes?.includes(currentUserEmail);
  const likeCount = parlay.likes?.length || 0;

  const toggleLike = async (e) => {
    e.stopPropagation();
    const currentLikes = parlay.likes || [];
    const newLikes = liked
      ? currentLikes.filter(e => e !== currentUserEmail)
      : [...currentLikes, currentUserEmail];
    await base44.entities.ParlayRecord.update(parlay.id, { likes: newLikes });
    // optimistic update handled by parent refresh
    parlay.likes = newLikes;
  };

  const resultColor = parlay.result === 'win' ? 'text-primary' : parlay.result === 'loss' ? 'text-red-400' : 'text-muted-foreground';
  const completedLegs = parlay.result === 'win' ? parlay.legs?.length || 0 : parlay.result === 'loss' ? Math.floor((parlay.legs?.length || 0) * 0.6) : null;
  const resultLabel = parlay.result === 'win' ? `✓ Went ${completedLegs}/${parlay.legs?.length || 0}` : parlay.result === 'loss' ? `✗ Went ${completedLegs}/${parlay.legs?.length || 0}` : 'PENDING';

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{parlay.sport}</span>
              <span className={cn("text-[10px] font-bold uppercase", resultColor)}>{resultLabel}</span>
            </div>
            <p className="font-display font-bold text-foreground text-sm truncate">{parlay.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {parlay.result === 'win' 
                ? `Went ${parlay.legs?.length || 0}/${parlay.legs?.length || 0}`
                : parlay.result === 'loss'
                ? `Went ${Math.floor((parlay.legs?.length || 0) * 0.6)}/${parlay.legs?.length || 0}`
                : `${parlay.legs?.length || 0} legs · ${parlay.totalOdds}`
              }
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all border",
                liked
                  ? "bg-red-400/15 text-red-400 border-red-400/30"
                  : "bg-secondary text-muted-foreground border-transparent hover:text-red-400"
              )}
            >
              <Heart className={cn("w-3 h-3", liked && "fill-current")} />
              {likeCount}
            </button>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>
      </button>
      {expanded && parlay.legs?.length > 0 && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-1.5">
          {parlay.legs.map((leg, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
              <span className="flex-1 text-foreground">{leg.pick}</span>
              <span className="text-accent font-bold">{leg.odds}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommunityFeed() {
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    loadParlays();
  }, []);

  const loadParlays = async () => {
    setLoading(true);
    const records = await base44.entities.ParlayRecord.list('-created_date', 50);
    setParlays(records || []);
    setLoading(false);
  };

  const sorted = [...parlays].sort((a, b) => {
    if (sortBy === 'likes') return (b.likes?.length || 0) - (a.likes?.length || 0);
    if (sortBy === 'wins') {
      const wa = a.result === 'win' ? 1 : 0;
      const wb = b.result === 'win' ? 1 : 0;
      return wb - wa;
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Community Pick Slips</h2>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{parlays.length} picks shared</p>
        </div>
        <div className="flex gap-1">
          {['recent', 'likes', 'wins'].map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
                sortBy === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === 'recent' ? '🕐 Recent' : s === 'likes' ? '❤️ Top' : '🏆 Wins'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No community parlays yet. Generate some!</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(p => (
            <CommunityParlayCard key={p.id} parlay={p} currentUserEmail={currentUser?.email} />
          ))}
        </div>
      )}
    </div>
  );
}