import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Plus, Store } from 'lucide-react';
import MarketplaceCard from '../components/marketplace/MarketplaceCard';

const SPORTS = ['All', 'NFL', 'NBA', 'MLB', 'NHL', 'UFC', 'Tennis', 'Golf', 'NCAAB', 'NCAAF'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'best_record', label: 'Best Record' },
  { value: 'most_purchased', label: 'Most Purchased' },
  { value: 'lowest_price', label: 'Lowest Price' },
];

export default function Marketplace() {
  const [sport, setSport] = useState('All');
  const [sort, setSort] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(50);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: parlays = [] } = useQuery({
    queryKey: ['marketplace_parlays'],
    queryFn: () => base44.entities.UserParlay.filter({ approved: true }),
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['creators'],
    queryFn: () => base44.entities.CreatorProfile.list(),
  });

  useEffect(() => {
    if (!user) return;
    base44.entities.Purchase.filter({ buyerEmail: user.email }).then(setPurchases).catch(() => {});
  }, [user]);

  const creatorMap = {};
  creators.forEach(c => { creatorMap[c.userId] = c; });

  const purchasedIds = new Set(purchases.map(p => p.parlayId));

  const handleBuy = async (parlay) => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    const isFree = !parlay.price || parlay.price === 0;
    if (isFree) {
      await base44.entities.Purchase.create({
        buyerId: user.id,
        buyerEmail: user.email,
        parlayId: parlay.id,
        creatorId: parlay.creatorId,
        amountPaid: 0,
        platformFee: 0,
        creatorEarnings: 0,
      });
      setPurchases(prev => [...prev, { parlayId: parlay.id }]);
    } else {
      alert('Stripe payment coming soon! This pick costs $' + parlay.price?.toFixed(2));
    }
  };

  const handleFlag = async (parlayId) => {
    await base44.entities.UserParlay.update(parlayId, { flagged: true });
    alert('Pick flagged for review. Thank you!');
  };

  let filtered = [...parlays];
  if (sport !== 'All') filtered = filtered.filter(p => p.sport === sport);
  if (search) filtered = filtered.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));
  filtered = filtered.filter(p => (p.price || 0) <= maxPrice);

  if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  else if (sort === 'most_purchased') filtered.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
  else if (sort === 'lowest_price') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sort === 'best_record') {
    filtered.sort((a, b) => {
      const ca = creatorMap[a.creatorId];
      const cb = creatorMap[b.creatorId];
      const rateA = ca && (ca.wins + ca.losses) > 0 ? ca.wins / (ca.wins + ca.losses) : 0;
      const rateB = cb && (cb.wins + cb.losses) > 0 ? cb.wins / (cb.wins + cb.losses) : 0;
      return rateB - rateA;
    });
  }

  return (
    <div className="min-h-screen font-inter" style={{ background: '#0D0D0D' }}>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: '#111', borderColor: '#222' }}>
        <div className="max-w-[430px] mx-auto px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-[#555] hover:text-white transition-colors text-xs">← Back</Link>
              <h1 className="font-display tracking-widest text-white" style={{ fontSize: '22px' }}>
                <Store className="inline w-5 h-5 mr-1.5 mb-0.5" style={{ color: '#00C853' }} />
                Marketplace
              </h1>
            </div>
            <div className="flex gap-2">
              <Link to="/builder" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#00C853', color: '#000' }}>
                <Plus className="w-3 h-3" /> Sell Pick
              </Link>
              <Link to="/my-picks" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#1A1A1A', color: '#666', border: '1px solid #222' }}>
                My Picks
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search picks..."
              className="w-full rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#444] outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #222' }}
            />
          </div>

          {/* Sport filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SPORTS.map(s => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: sport === s ? '#00C853' : '#1A1A1A',
                  color: sport === s ? '#000' : '#666',
                  border: `1px solid ${sport === s ? '#00C853' : '#222'}`
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4">
        {/* Sort + filters */}
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#555]" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {SORT_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setSort(o.value)}
                className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: sort === o.value ? '#FFD60022' : '#1A1A1A',
                  color: sort === o.value ? '#FFD600' : '#555',
                  border: `1px solid ${sort === o.value ? '#FFD60044' : '#222'}`
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-[#555]">Max $</span>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-12 rounded-lg px-2 py-1 text-xs text-white outline-none text-center"
              style={{ background: '#1A1A1A', border: '1px solid #222' }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 mx-auto mb-3" style={{ color: '#222' }} />
            <p className="text-white font-semibold">No picks available</p>
            <p className="text-xs mt-1 text-[#555]">Be the first to sell a pick!</p>
            <Link to="/builder" className="inline-block mt-4 font-bold px-6 py-2.5 rounded-full text-sm" style={{ background: '#00C853', color: '#000' }}>
              + Sell a Pick
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(parlay => (
              <MarketplaceCard
                key={parlay.id}
                parlay={parlay}
                creator={creatorMap[parlay.creatorId]}
                onBuy={handleBuy}
                onFlag={handleFlag}
                isPurchased={purchasedIds.has(parlay.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}