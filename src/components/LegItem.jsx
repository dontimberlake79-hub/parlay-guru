import { cn } from '@/lib/utils';

export default function LegItem({ leg, index }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-md bg-background/50 group">
      <span className="text-[11px] font-bold text-muted-foreground w-5 text-center font-display">{index + 1}</span>
      <div className="h-8 w-px bg-border" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{leg.pick}</p>
        <p className="text-xs text-muted-foreground truncate">{leg.matchup}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-display font-bold text-foreground">{leg.odds}</p>
        <p className={cn(
          "text-[11px] font-medium",
          leg.confidence >= 70 ? "text-primary" : leg.confidence >= 45 ? "text-blue-400" : leg.confidence >= 25 ? "text-accent" : "text-red-400"
        )}>{leg.confidence}% conf</p>
      </div>
    </div>
  );
}