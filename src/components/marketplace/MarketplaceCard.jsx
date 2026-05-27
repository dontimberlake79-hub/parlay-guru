import { useState } from 'react';
import { ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';

const SPORT_COLORS = {
  NBA: '#C9A84C', NFL: '#013369', MLB: '#002D72', NHL: '#00539B',
  UFC: '#D20A2E', Tennis: '#5C8A3A', Golf: '#1E7A34', default: '#00C853',
};

const STATUS_CONFIG = {
  won: { label: 'WIN', bg: '#00C853' },
  lost: { label: 'LOSS', bg: '#FF3B3B' },
  push: { label: 'PUSH', bg: '#555' },
  pending: { label: 'LIVE', bg: '#FFD600' },
};

export default function MarketplaceCard({ parlay, creator, onBuy, onFlag, isPurchased }) {
  const [expanded, setExpanded] = useState(false);
  const sportColor = SPORT_COLORS[parlay.sport] || SPORT_COLORS.default;
  const statusCfg = STATUS_CONFIG[parlay.status] || STATUS_CONFIG.pending;
  const wins = creator?.wins || 0;
  const losses = creator?.losses || 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const isNew = total < 10;
  const isFree = !parlay.price || parlay.price === 0;

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid #222' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: sportColor }} />

      <div className="pl-4 pr-3 pt-3 pb-2">
        {/* Creator row */}
        <div className="flex items-center justify-between mb-2">
          <Link to={`/creator/${creator?.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: sportColor + '33', color: sportColor }}>
              {(creator?.displayName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-xs">{creator?.displayName || 'Unknown'}</p>
              <p className="text-[10px]" style={{ color: '#555' }}>
                {wins}W-{losses}L {total > 0 ? `• ${winRate}%` : ''}{creator?.roi ? ` • ${creator.roi > 0 ? '+' : ''}${creator.roi}% ROI` : ''}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isNew && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FFD60022', color: '#FFD600', border: '1px solid #FFD60044' }}>NEW</span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: statusCfg.bg + '22', color: statusCfg.bg, border: `1px solid ${statusCfg.bg}44` }}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Parlay info */}
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sportColor + '22', color: sportColor, border: `1px solid ${sportColor}44` }}>
                  {parlay.sport}
                </span>
                <span className="text-[10px] text-[#555]">{parlay.legs?.length || 0}-LEG</span>
              </div>
              <p className="font-semibold text-white text-sm leading-tight">{parlay.title}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono font-bold text-[#00C853] text-lg">{parlay.totalOdds}</p>
              {expanded ? <ChevronUp className="w-3 h-3 text-[#555] ml-auto mt-1" /> : <ChevronDown className="w-3 h-3 text-[#555] ml-auto mt-1" />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
            {(isPurchased || isFree) ? (
              parlay.legs?.map((leg, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 rounded-lg px-2" style={{ background: '#1A1A1A' }}>
                  <span className="text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#222', color: '#555' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold">{leg.pick}</p>
                    <p className="text-[10px] text-[#555]">{leg.game} &bull; {leg.betType} &bull; {leg.odds}</p>
                    {leg.reasoning && <p className="text-[10px] text-[#888] italic mt-0.5">&ldquo;{leg.reasoning}&rdquo;</p>}
                  </div>
                  {leg.result && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{
                      background: leg.result === 'won' ? '#00C85333' : '#FF3B3B33',
                      color: leg.result === 'won' ? '#00C853' : '#FF3B3B'
                    }}>{leg.result === 'won' ? 'WIN' : 'LOSS'}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-3">
                <p className="text-[#555] text-xs mb-2">Purchase to unlock full leg details</p>
                <div className="flex gap-1 justify-center">
                  {parlay.legs?.map((_, i) => (
                    <div key={i} className="h-8 flex-1 rounded" style={{ background: '#1A1A1A', border: '1px solid #222', filter: 'blur(2px)' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#555]">{parlay.purchaseCount || 0} sold</span>
            <button onClick={() => onFlag?.(parlay.id)} className="text-[#444] hover:text-red-400 transition-colors">
              <Flag className="w-3 h-3" />
            </button>
          </div>
          {isPurchased ? (
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: '#00C85322', color: '#00C853', border: '1px solid #00C85344' }}>
              ✓ Purchased
            </span>
          ) : (
            <button
              onClick={() => onBuy?.(parlay)}
              className="font-bold px-3 py-1.5 rounded-full text-xs transition-all hover:opacity-80"
              style={{ background: isFree ? '#1A1A1A' : '#00C853', color: isFree ? '#00C853' : '#000', border: isFree ? '1px solid #00C85344' : 'none' }}
            >
              {isFree ? 'FREE - View' : `$${parlay.price?.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}