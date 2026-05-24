import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

export default function GameSelector({ games, selected, onToggle }) {
  if (!games.length) return null;

  const allSelected = games.every(g => selected.includes(g.id));

  const toggleAll = () => {
    if (allSelected) {
      games.forEach(g => { if (selected.includes(g.id)) onToggle(g.id); });
    } else {
      games.forEach(g => { if (!selected.includes(g.id)) onToggle(g.id); });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Games</h2>
        <button onClick={toggleAll} className="text-xs text-primary font-semibold hover:underline">
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {games.map(game => {
          const active = selected.includes(game.id);
          return (
            <button
              key={game.id}
              onClick={() => onToggle(game.id)}
              className={cn(
                "flex items-start gap-2 p-3 rounded-lg border text-left transition-all",
                active ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
                active ? "bg-primary border-primary" : "border-muted-foreground/40"
              )}>
                {active && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{game.away} @ {game.home}</p>
                <p className="text-[10px] text-muted-foreground">{game.sport} · {formatTime(game.commenceTime)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}