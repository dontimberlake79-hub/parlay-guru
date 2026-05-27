import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, ShoppingBag, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';

const STATUS_BADGE = {
  pending: { label: 'Pending', color: '#FFD600' },
  won: { label: 'WIN', color: '#00C853' },
  lost: { label: 'LOSS', color: '#FF3B3B' },
  push: { label: 'Push', color: '#555' },
};

export default function MyPicksDashboard() {
  const [user, setUser] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.CreatorProfile.filter({ userEmail: u.email }).then(res => setCreatorProfile(res?.[0] || null));
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: parlays = [] } = useQuery({
    queryKey: ['my_parlays', user?.id],
    queryFn: () => base44.entities.UserParlay.filter({ creatorId: user.id }),
    enabled: !!user,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['my_sales', user?.id],
    queryFn: () => base44.entities.Purchase.filter({ creatorId: user.id }),
    enabled: !!user,
  });

  const totalSales = purchases.length;
  const totalEarnings = purchases.reduce((s, p) => s + (p.creatorEarnings || 0), 0);
  const pending = parlays.filter(p => !p.approved);
  const approved = parlays.filter(p => p.approved);
  const wins = parlays.filter(p => p.status === 'won').length;
  const losses = parlays.filter(p => p.status === 'lost').length;

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
            <h1 className="font-display tracking-widest text-white" style={{ fontSize: '20px' }}>My Picks</h1>
          </div>
          <Link to="/builder" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#00C853', color: '#000' }}>
            <Plus className="w-3 h-3" /> New Pick
          </Link>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>Earnings</p>
            <p className="font-mono font-bold text-2xl" style={{ color: '#00C853' }}>${totalEarnings.toFixed(2)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#444' }}>after 20% platform fee</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>Sales</p>
            <p className="font-mono font-bold text-2xl text-white">{totalSales}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#444' }}>total purchases</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>Record</p>
            <p className="font-mono font-bold text-xl"><span style={{ color: '#00C853' }}>{wins}W</span> <span style={{ color: '#555' }}>-</span> <span style={{ color: '#FF3B3B' }}>{losses}L</span></p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>Payout Balance</p>
            <p className="font-mono font-bold text-xl text-white">${(creatorProfile?.payoutBalance || 0).toFixed(2)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#444' }}>Stripe Connect req.</p>
          </div>
        </div>

        {/* Pending approval */}
        {pending.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#FFD600' }}>
              <Clock className="w-3 h-3" /> Pending Approval ({pending.length})
            </h2>
            <div className="space-y-2">
              {pending.map(p => (
                <ParlayRow key={p.id} parlay={p} salesCount={purchases.filter(x => x.parlayId === p.id).length} />
              ))}
            </div>
          </section>
        )}

        {/* Approved picks */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>
            Posted Picks ({approved.length})
          </h2>
          {approved.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ background: '#141414', border: '1px solid #222' }}>
              <ShoppingBag className="w-8 h-8 mx-auto mb-2" style={{ color: '#222' }} />
              <p className="text-[#555] text-sm">No approved picks yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {approved.map(p => (
                <ParlayRow key={p.id} parlay={p} salesCount={purchases.filter(x => x.parlayId === p.id).length} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ParlayRow({ parlay, salesCount }) {
  const statusCfg = STATUS_BADGE[parlay.status] || STATUS_BADGE.pending;
  return (
    <div className="rounded-xl px-3 py-3 flex items-center justify-between" style={{ background: '#141414', border: '1px solid #222' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
          {!parlay.approved && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#FFD60022', color: '#FFD600' }}>AWAITING REVIEW</span>}
          <span className="text-[10px] text-[#555]">{parlay.sport}</span>
        </div>
        <p className="text-white text-sm font-semibold truncate">{parlay.title}</p>
        <p className="text-[10px] text-[#555] mt-0.5">{parlay.legs?.length || 0} legs • {parlay.totalOdds} • {salesCount} sold</p>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="font-mono font-bold text-sm" style={{ color: parlay.price ? '#00C853' : '#555' }}>
          {parlay.price ? `$${parlay.price.toFixed(2)}` : 'FREE'}
        </p>
      </div>
    </div>
  );
}