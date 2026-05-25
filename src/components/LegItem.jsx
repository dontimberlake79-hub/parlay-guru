import { cn } from '@/lib/utils';

export default function LegItem({ leg, index }) {
  // Handle different possible field names from LLM
  const pick = leg.pick || leg.player || leg.description || '';
  const matchup = leg.matchup || leg.game || leg.event || '';
  const odds = leg.odds || leg.line || '';
  const confidence = leg.confidence || 50;
  const hotStreak = leg.hotStreak || 0;
  const overCount = leg.overCount;
  const overPercentage = leg.overPercentage;
  
  // Extract player name from pick (first 2-3 words before stats)
  const playerName = pick.split(' ').slice(0, 3).join(' ').replace(/(\d+\+?|\d+\.\d+\+?)/, '').trim();
  
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-md bg-background/50 group">
      <span className="text-[11px] font-bold text-muted-foreground w-5 text-center font-display">{index + 1}</span>
      <div className="h-8 w-px bg-border" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground truncate">{pick}</p>
          {hotStreak >= 1 && (
            <span className="text-xs">
              {hotStreak === 2 ? '🔥🔥' : '🔥'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{matchup}</p>
        {overCount !== undefined && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Hit {overCount}/10 last games ({overPercentage}%)
          </p>
        )}
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