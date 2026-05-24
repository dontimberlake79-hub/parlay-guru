import { Trophy, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ParlayTracker({ records, onMark }) {
  const wins = records.filter(r => r.result === 'win').length;
  const losses = records.filter(r => r.result === 'loss').length;
  const pending = records.filter(r => !r.result).length;

  if (!records.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Parlay Tracker</h2>
      <div className="flex gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-primary">{wins}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Wins</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-red-400">{losses}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Losses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-muted-foreground">{pending}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
        </div>
        {records.length > 0 && (
          <div className="text-center ml-auto">
            <p className="text-2xl font-display font-bold text-accent">
              {records.length > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Hit Rate</p>
          </div>
        )}
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {records.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              r.result === 'win' ? 'bg-primary' : r.result === 'loss' ? 'bg-red-400' : 'bg-muted-foreground'
            )} />
            <span className="flex-1 truncate text-muted-foreground">{r.title}</span>
            <span className="text-accent font-bold">{r.totalOdds}</span>
            <div className="flex gap-1">
              <button
                onClick={() => onMark(r.id, 'win')}
                className={cn("p-1 rounded", r.result === 'win' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary')}
                title="Mark as Win"
              >
                <Trophy className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMark(r.id, 'loss')}
                className={cn("p-1 rounded", r.result === 'loss' ? 'bg-red-400/20 text-red-400' : 'text-muted-foreground hover:text-red-400')}
                title="Mark as Loss"
              >
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMark(r.id, null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
                title="Clear"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}