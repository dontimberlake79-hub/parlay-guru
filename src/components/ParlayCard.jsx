import { Trophy, ChevronDown, ChevronUp, Share2, Star, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import LegItem from './LegItem';
import ShareablePickCard from './ShareablePickCard';

const SPORT_COLORS = {
  NBA: '#C9A84C',
  NFL: '#013369',
  MLB: '#002D72',
  NHL: '#00539B',
  UFC: '#D20A2E',
  Tennis: '#5C8A3A',
  Golf: '#1E7A34',
  MLS: '#1F3C88',
  NCAAB: '#E84A27',
  NCAAF: '#BF5700',
  default: '#00C853',
};

const PARLAY_TYPE_LABEL = {
  quick_hit: { label: 'Quick Hit', color: '#00C853' },
  main_slate: { label: 'Main Slate', color: '#FFD600' },
  power_parlay: { label: 'Power Parlay', color: '#FF6B35' },
};

function getParlayType(parlay) {
  if (parlay.parlayType) return PARLAY_TYPE_LABEL[parlay.parlayType] || null;
  const legs = parlay.legs?.length || 0;
  if (legs <= 2) return PARLAY_TYPE_LABEL.quick_hit;
  if (legs === 3) return PARLAY_TYPE_LABEL.main_slate;
  if (legs >= 4) return PARLAY_TYPE_LABEL.power_parlay;
  return null;
}

const STATUS_CONFIG = {
  won: { label: 'WIN', bg: '#00C853', text: '#000' },
  lost: { label: 'LOSS', bg: '#FF3B3B', text: '#fff' },
  push: { label: 'PUSH', bg: '#555', text: '#fff' },
};

export default function ParlayCard({ parlay, tier, isDailyPick = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [revealedLegs, setRevealedLegs] = useState(0);

  useEffect(() => {
    if (expanded && parlay.legs?.length > 0) {
      setRevealedLegs(0);
      parlay.legs.forEach((_, i) => {
        setTimeout(() => setRevealedLegs(i + 1), (i + 1) * 120);
      });
    }
  }, [expanded, parlay.legs?.length]);

  const sportColor = SPORT_COLORS[parlay.sport] || SPORT_COLORS.default;
  const statusConfig = parlay.status ? STATUS_CONFIG[parlay.status] : null;
  const legCount = parlay.legs?.length || 0;

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid #222' }}>
      {/* Left accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: statusConfig ? statusConfig.bg : sportColor }} />

      {/* Win/Loss banner */}
      {statusConfig && (
        <div className="flex items-center justify-center py-1.5 font-bold text-sm tracking-widest" style={{ background: statusConfig.bg, color: statusConfig.text }}>
          {statusConfig.label}
        </div>
      )}

      {/* Card header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left pl-4 pr-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${sportColor}22`, color: sportColor, border: `1px solid ${sportColor}44` }}>
                {parlay.sport}
              </span>
              <span className="text-[10px] font-bold text-[#555] uppercase">{legCount}-LEG PARLAY</span>
              {(() => { const t = getParlayType(parlay); return t ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}>{t.label}</span> : null; })()}
            </div>
            <p className="font-semibold text-white leading-tight" style={{ fontSize: '14px' }}>{parlay.title}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono font-bold text-[#00C853]" style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>{parlay.totalOdds}</p>
            {parlay.winProbability !== undefined && (
              <p className="text-[#555]" style={{ fontSize: '10px' }}>{parlay.winProbability}% hit rate</p>
            )}
          </div>
        </div>

        {/* Value rating stars */}
        {parlay.valueRating && (
          <div className="flex items-center gap-1 mt-1.5">
            {[1,2,3,4,5].map(star => (
              <Star key={star} className={cn('w-2.5 h-2.5', star <= parlay.valueRating ? 'fill-[#FFD600] text-[#FFD600]' : 'fill-[#222] text-[#222]')} />
            ))}
            <span className="text-[10px] text-[#555] ml-0.5">Value</span>
          </div>
        )}

        {/* Win probability bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 rounded-full bg-[#222] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${parlay.winProbability || 0}%`, background: '#00C853' }} />
          </div>
          <ChevronDown className={cn('w-3.5 h-3.5 text-[#555] transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Expanded legs */}
      {expanded && (
        <div className="pl-4 pr-3 pb-3 border-t border-white/5">
          {parlay.legs && parlay.legs.length > 0 ? (
            <div>
              {parlay.legs.map((leg, i) => (
                <div
                  key={i}
                  style={{
                    opacity: i < revealedLegs ? 1 : 0,
                    transform: i < revealedLegs ? 'translateY(0)' : 'translateY(4px)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LegItem leg={leg} index={i} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#555] text-xs py-3">No legs data available</p>
          )}

          {parlay.reasoning && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Analyst Note</p>
              <p className="text-[#888] text-xs leading-relaxed italic">💡 {parlay.reasoning}</p>
            </div>
          )}

          <p className="text-[10px] text-[#444] mt-3 pt-2 border-t border-white/5">
            ⚠️ Entertainment only — not financial advice. Please gamble responsibly.
          </p>
        </div>
      )}

      {/* Share button */}
      {!isDailyPick && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
          className="absolute top-3 right-3 p-1.5 rounded-full text-[#555] hover:text-[#00C853] transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      )}

      <ShareablePickCard parlay={parlay} tier={tier} isOpen={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
}