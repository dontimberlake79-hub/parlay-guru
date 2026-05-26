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
    <div className="py-2 px-3 rounded-md bg-background/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <p className="font-semibold text-foreground" style={{ fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>{playerName}</span>{pick.slice(playerName.length)}
            </p>
            {hotStreak >= 1 && <span style={{ fontSize: '12px' }}>{hotStreak === 2 ? '🔥🔥' : '🔥'}</span>}
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{matchup}</p>
          {overCount !== undefined && (
            <p className="text-muted-foreground/70" style={{ fontSize: '11px' }}>Hit {overCount}/10 ({overPercentage}%)</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-display" style={{ fontSize: '16px', letterSpacing: '0.05em', color: odds.startsWith('+') ? '#22c55e' : odds.startsWith('-') ? '#ef4444' : 'inherit' }}>{odds}</p>
          <p className={cn(
            'font-medium',
            confidence >= 70 ? 'text-primary' : confidence >= 45 ? 'text-blue-400' : confidence >= 25 ? 'text-accent' : 'text-red-400'
          )} style={{ fontSize: '11px' }}>{confidence}% conf</p>
        </div>
      </div>
    </div>
  );
}