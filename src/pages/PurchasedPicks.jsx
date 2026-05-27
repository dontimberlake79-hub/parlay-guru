import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  won: { label: 'WIN', bg: '#00C853', text: '#000' },
  lost: { label: 'LOSS', bg: '#FF3B3B', text: '#fff' },
  push: { label: 'PUSH', bg: '#555', text: '#fff' },
  pending: { label: 'LIVE', bg: '#FFD600', text: '#000' },
};

export default function PurchasedPicks() {
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchased_picks', user?.email],
    queryFn: () => base44.entities.Purchase.filter({ buyerEmail: user.email }),
    enabled: !!user,
  });

  const parlayIds = purchases.map(p => p.parlayId);

  const { data: parlays = [] } = useQuery({
    queryKey: ['purchased_parlays', parlayIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(parlayIds.map(id => base44.entities.UserParlay.get(id).catch(() => null)));
      return results.filter(Boolean);
    },
    enabled: parlayIds.length > 0,
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['creators_for_purchases'],
    queryFn: () => base44.entities.CreatorProfile.list(),
    enabled: parlays.length > 0,
  });

  const creatorMap = {};
  creators.forEach(c => { creatorMap[c.userId] = c; });

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen font-inter" style={{ background: '#0D0D0D' }}>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: '#111', borderColor: '#222' }}>
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/marketplace" className="text-[#555] text-xs">← Back</Link>
            <h1 className="font-display tracking-widest text-white" style={{ fontSize: '20px' }}>My Purchases</h1>
          </div>
          <span className="text-xs text-[#555]">{parlays.length} picks</span>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4">
        {parlays.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: '#222' }} />
            <p className="text-white font-semibold">No purchases yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#555' }}>Browse the marketplace to find picks</p>
            <Link to="/marketplace" className="inline-block font-bold px-6 py-2.5 rounded-full text-sm" style={{ background: '#00C853', color: '#000' }}>
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {parlays.map(parlay => {
              const creator = creatorMap[parlay.creatorId];
              const statusCfg = STATUS_CONFIG[parlay.status] || STATUS_CONFIG.pending;
              const isExpanded = expanded === parlay.id;
              const purchase = purchases.find(p => p.parlayId === parlay.id);

              return (
                <div key={parlay.id} className="rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid #222' }}>
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/creator/${creator?.id}`} className="flex items-center gap-1.5 hover:opacity-80">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#00C85322', color: '#00C853' }}>
                          {(creator?.displayName || 'U')[0]}
                        </div>
                        <span className="text-xs text-white font-semibold">{creator?.displayName || 'Unknown'}</span>
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#00C85322', color: '#00C853' }}>✓ Purchased</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: statusCfg.bg + '22', color: statusCfg.bg }}>{statusCfg.label}</span>
                      </div>
                    </div>

                    <button onClick={() => setExpanded(isExpanded ? null : parlay.id)} className="w-full text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold text-sm">{parlay.title}</p>
                          <p className="text-[10px] text-[#555] mt-0.5">{parlay.sport} • {parlay.legs?.length || 0} legs • {parlay.totalOdds}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold" style={{ color: '#00C853' }}>{parlay.totalOdds}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#555]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#555]" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                        {parlay.legs?.map((leg, i) => (
                          <div key={i} className="flex items-start gap-2 py-2 rounded-lg px-2" style={{ background: '#1A1A1A' }}>
                            <span className="text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0" style={{ background: '#222', color: '#555' }}>{i + 1}</span>
                            <div className="flex-1">
                              <p className="text-white text-xs font-semibold">{leg.pick}</p>
                              <p className="text-[10px] text-[#555]">{leg.game} &bull; {leg.betType} &bull; {leg.odds}</p>
                              {leg.reasoning && <p className="text-[10px] text-[#888] italic mt-0.5">&ldquo;{leg.reasoning}&rdquo;</p>}
                            </div>
                            {leg.result && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{
                                background: leg.result === 'won' ? '#00C85333' : '#FF3B3B33',
                                color: leg.result === 'won' ? '#00C853' : '#FF3B3B'
                              }}>{leg.result === 'won' ? 'WIN' : 'LOSS'}</span>
                            )}
                          </div>
                        ))}
                        {parlay.notes && (
                          <p className="text-[10px] text-[#888] italic px-1">&ldquo;{parlay.notes}&rdquo;</p>
                        )}
                        <p className="text-[10px] text-[#444]">
                          Paid: {purchase?.amountPaid === 0 ? 'Free' : `$${purchase?.amountPaid?.toFixed(2)}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}