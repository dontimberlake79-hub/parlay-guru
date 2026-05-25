import { cn } from '@/lib/utils';

export default function LegItem({ leg, index }) {
  // Handle different possible field names from LLM
  const pick = leg.pick || leg.player || leg.description || '';
  const matchup = leg.matchup || leg.game || leg.event || '';
  const odds = leg.odds || leg.line || '';
  const confidence = leg.confidence || 50;
  
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-md bg-background/50 group">
      <span className="text-[11px] font-bold text-muted-foreground w-5 text-center font-display">{index + 1}</span>
      <div className="h-8 w-px bg-border" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{pick}</p>
        <p className="text-xs text-muted-foreground truncate">{matchup}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-display font-bold text-foreground">{odds}</p>
        <p className={cn(
          "text-[11px] font-medium",
          confidence >= 70 ? "text-primary" : confidence >= 45 ? "text-blue-400" : confidence >= 25 ? "text-accent" : "text-red-400"
        )}>{confidence}% conf</p>
      </div>
    </div>
  );
}