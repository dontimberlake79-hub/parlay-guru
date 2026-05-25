import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function groupByDate(games) {
  const groups = {};
  games.forEach(g => {
    const label = formatDate(g.commenceTime);
    if (!groups[label]) groups[label] = [];
    groups[label].push(g);
  });
  return groups;
}

export default function UpcomingGames({ games, selected, onToggle }) {
  const grouped = groupByDate(games);
  const dates = Object.keys(grouped);
  const [activeTab, setActiveTab] = useState(dates[0] || '');

  useEffect(() => {
    if (dates.length && !grouped[activeTab]) {
      setActiveTab(dates[0]);
    }
  }, [games]);

  if (!dates.length) return null;

  const activeGames = grouped[activeTab] || [];

  return (
    <div>
      {/* Date tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-hide">
        {dates.map(date => (
          <button
            key={date}
            onClick={() => setActiveTab(date)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0",
              activeTab === date
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            <Calendar className="w-3 h-3" />
            {date}
            <span className="text-[10px] opacity-60">({grouped[date].length})</span>
          </button>
        ))}
      </div>

      {/* Games list */}
      <div className="space-y-2">
        {activeGames.map(game => {
          const isSelected = selected.includes(game.id);
          const h2h = game.odds?.find(m => m.market === 'h2h');
          const homeOdds = h2h?.outcomes?.find(o => o.name === game.home)?.price;
          const awayOdds = h2h?.outcomes?.find(o => o.name === game.away)?.price;

          return (
            <button
              key={game.id}
              onClick={() => onToggle(game.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all",
                isSelected
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-card border-border hover:border-muted-foreground/30'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{game.sport}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(game.commenceTime)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{game.away} <span className="text-muted-foreground font-normal">vs</span> {game.home}</p>
                </div>
                {h2h && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-md",
                      isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    )}>
                      {awayOdds > 0 ? `+${awayOdds}` : awayOdds}
                    </span>
                    <span className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-md",
                      isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    )}>
                      {homeOdds > 0 ? `+${homeOdds}` : homeOdds}
                    </span>
                  </div>
                )}
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                )} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}