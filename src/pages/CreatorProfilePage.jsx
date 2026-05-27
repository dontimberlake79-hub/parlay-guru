import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus, TrendingUp, Trophy, Target } from 'lucide-react';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';

export default function CreatorProfilePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [followRecord, setFollowRecord] = useState(null);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: creator } = useQuery({
    queryKey: ['creator', id],
    queryFn: () => base44.entities.CreatorProfile.get(id),
    enabled: !!id,
  });

  const { data: parlays = [] } = useQuery({
    queryKey: ['creator_parlays', id],
    queryFn: () => base44.entities.UserParlay.filter({ creatorId: creator?.userId, approved: true }),
    enabled: !!creator?.userId,
  });

  useEffect(() => {
    if (!user || !id) return;
    base44.entities.Follow.filter({ followerId: user.id, creatorId: id })
      .then(res => setFollowRecord(res?.[0] || null)).catch(() => {});
    base44.entities.Purchase.filter({ buyerEmail: user.email })
      .then(setPurchases).catch(() => {});
  }, [user, id]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (followRecord) {
        await base44.entities.Follow.delete(followRecord.id);
        return null;
      } else {
        return base44.entities.Follow.create({
          followerId: user.id, followerEmail: user.email,
          creatorId: id, creatorEmail: creator?.userEmail,
        });
      }
    },
    onSuccess: (data) => {
      setFollowRecord(data);
      queryClient.invalidateQueries({ queryKey: ['creator', id] });
    },
  });

  const handleBuy = async (parlay) => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    const isFree = !parlay.price || parlay.price === 0;
    if (isFree) {
      await base44.entities.Purchase.create({
        buyerId: user.id, buyerEmail: user.email,
        parlayId: parlay.id, creatorId: id,
        amountPaid: 0, platformFee: 0, creatorEarnings: 0,
      });
      setPurchases(prev => [...prev, { parlayId: parlay.id }]);
    } else {
      alert('Stripe payment coming soon! This pick costs $' + parlay.price?.toFixed(2));
    }
  };

  const purchasedIds = new Set(purchases.map(p => p.parlayId));
  const total = (creator?.wins || 0) + (creator?.losses || 0);
  const winRate = total > 0 ? Math.round((creator.wins / total) * 100) : 0;
  const past = parlays.filter(p => p.status !== 'pending');
  const active = parlays.filter(p => p.status === 'pending');

  if (!creator) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen font-inter" style={{ background: '#0D0D0D' }}>
      <div className="max-w-[430px] mx-auto">
        {/* Hero */}
        <div className="px-3 pt-4 pb-3" style={{ background: '#111', borderBottom: '1px solid #222' }}>
          <Link to="/marketplace" className="text-[#555] hover:text-white transition-colors text-xs block mb-3">← Marketplace</Link>
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl font-display" style={{ background: '#00C85322', color: '#00C853' }}>
              {creator.displayName[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-white font-bold text-lg">{creator.displayName}</h1>
                {creator.verified && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#00C85322', color: '#00C853' }}>✓ VER</span>}
                {total < 10 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#FFD60022', color: '#FFD600' }}>NEW</span>}
              </div>
              {creator.bio && <p className="text-[#888] text-xs mb-2">{creator.bio}</p>}
              {creator.sportSpecialties?.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">
                  {creator.sportSpecialties.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#1A1A1A', color: '#666', border: '1px solid #222' }}>{s}</span>
                  ))}
                </div>
              )}
              {user && (
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: followRecord ? '#1A1A1A' : '#00C853',
                    color: followRecord ? '#666' : '#000',
                    border: followRecord ? '1px solid #222' : 'none'
                  }}
                >
                  {followRecord ? <><UserMinus className="w-3 h-3" /> Unfollow</> : <><UserPlus className="w-3 h-3" /> Follow</>}
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: 'Record', value: `${creator.wins}W-${creator.losses}L` },
              { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 55 ? '#00C853' : winRate >= 45 ? '#FFD600' : '#FF3B3B' },
              { label: 'ROI', value: `${creator.roi > 0 ? '+' : ''}${creator.roi || 0}%`, color: (creator.roi || 0) >= 0 ? '#00C853' : '#FF3B3B' },
              { label: 'Followers', value: creator.totalFollowers || 0 },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-2 text-center" style={{ background: '#1A1A1A' }}>
                <p className="font-bold text-sm" style={{ color: stat.color || '#fff' }}>{stat.value}</p>
                <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#444' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-3 py-4 space-y-4">
          {/* Active picks */}
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Active Picks ({active.length})</h2>
              <div className="space-y-3">
                {active.map(p => (
                  <MarketplaceCard key={p.id} parlay={p} creator={creator} onBuy={handleBuy} isPurchased={purchasedIds.has(p.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Past picks */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Past Picks ({past.length})</h2>
              <div className="space-y-3">
                {past.map(p => (
                  <MarketplaceCard key={p.id} parlay={p} creator={creator} onBuy={handleBuy} isPurchased={purchasedIds.has(p.id)} />
                ))}
              </div>
            </section>
          )}

          {parlays.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-10 h-10 mx-auto mb-2" style={{ color: '#222' }} />
              <p className="text-[#555] text-sm">No picks posted yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}