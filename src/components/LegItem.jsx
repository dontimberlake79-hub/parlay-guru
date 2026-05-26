import { cn } from '@/lib/utils';

export default function LegItem({ leg, index, result }) {
  const pick = leg.pick || leg.player || leg.description || '';
  const matchup = leg.matchup || leg.game || leg.event || '';
  const odds = leg.odds || leg.line || '';
  const confidence = leg.confidence || 50;
  const hotStreak = leg.hotStreak || 0;
  const overCount = leg.overCount;
  const overPercentage = leg.overPercentage;
  const legReason = leg.legReason || '';
  const legResult = result || leg.result;

  const playerName = pick.split(' ').slice(0, 3).join(' ').replace(/(\d+\+?|\d+\.\d+\+?)/, '').trim();

  const oddsColor = odds.startsWith('+') ? '#00C853' : odds.startsWith('-') ? '#aaa' : '#fff';

  const resultBadge = legResult === 'won' ? (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30">✓ W</span>
  ) : legResult === 'lost' ? (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FF3B3B]/20 text-[#FF3B3B] border border-[#FF3B3B]/30">✗ L</span>
  ) : null;

  return (
    <div className="flex items-center justify-between gap-2 py-2.5 px-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-white leading-tight" style={{ fontSize: '13px' }}>
            {pick}
          </p>
          {hotStreak >= 1 && <span style={{ fontSize: '11px' }}>{hotStreak === 2 ? '🔥🔥' : '🔥'}</span>}
          {resultBadge}
        </div>
        <p className="text-[#666] mt-0.5" style={{ fontSize: '11px' }}>{matchup}</p>
        {overCount !== undefined && (
          <p className="text-[#555]" style={{ fontSize: '10px' }}>Hit {overCount}/10 last games</p>
        )}
        {legReason && (
          <p className="text-[#555] italic mt-0.5" style={{ fontSize: '10px' }}>"{legReason}"</p>
        )}
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="font-mono font-bold" style={{ fontSize: '15px', color: oddsColor, letterSpacing: '-0.02em' }}>{odds}</p>
        <p className="text-[#555]" style={{ fontSize: '10px' }}>{confidence}% conf</p>
      </div>
    </div>
  );
}