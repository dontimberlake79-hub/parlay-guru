import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Eye, Send, DollarSign } from 'lucide-react';
import LegBuilder from '../components/marketplace/LegBuilder';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UFC', 'Tennis', 'Golf', 'Other'];

function calcOdds(legs) {
  if (!legs.length) return 'N/A';
  let decimal = 1;
  for (const leg of legs) {
    const o = parseInt(leg.odds);
    if (isNaN(o)) continue;
    decimal *= o > 0 ? (o / 100 + 1) : (100 / Math.abs(o) + 1);
  }
  const american = decimal >= 2 ? `+${Math.round((decimal - 1) * 100)}` : `-${Math.round(100 / (decimal - 1))}`;
  return american;
}

const emptyLeg = () => ({ game: '', pick: '', betType: '', odds: '', reasoning: '' });

export default function ParlayBuilder() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('NFL');
  const [price, setPrice] = useState(0);
  const [legs, setLegs] = useState([emptyLeg()]);
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.CreatorProfile.filter({ userEmail: u.email }).then(res => {
        setCreatorProfile(res?.[0] || null);
      });
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const totalOdds = calcOdds(legs);
  const isFree = price === 0;
  const graded = (creatorProfile?.wins || 0) + (creatorProfile?.losses || 0);
  const canCharge = graded >= 5;

  const addLeg = () => {
    if (legs.length >= 6) return;
    setLegs(prev => [...prev, emptyLeg()]);
  };

  const updateLeg = (i, updated) => setLegs(prev => prev.map((l, idx) => idx === i ? updated : l));
  const removeLeg = (i) => setLegs(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title || legs.length === 0) { alert('Please add a title and at least 1 leg.'); return; }
    if (legs.some(l => !l.game || !l.pick || !l.odds)) { alert('Please fill in game, pick, and odds for every leg.'); return; }
    setSubmitting(true);

    if (!creatorProfile) {
      await base44.entities.CreatorProfile.create({
        userId: user.id,
        userEmail: user.email,
        displayName: user.full_name || user.email.split('@')[0],
        wins: 0, losses: 0, roi: 0, totalFollowers: 0, totalPicksSold: 0,
      });
    }

    await base44.entities.UserParlay.create({
      creatorId: user.id,
      creatorEmail: user.email,
      title,
      sport,
      legs,
      totalOdds,
      price: isFree ? 0 : price,
      status: 'pending',
      approved: false,
      notes,
    });

    setSubmitting(false);
    navigate('/my-picks');
  };

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
            <h1 className="font-display tracking-widest text-white" style={{ fontSize: '20px' }}>Build a Pick</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: preview ? '#FFD60022' : '#1A1A1A', color: preview ? '#FFD600' : '#555', border: `1px solid ${preview ? '#FFD60044' : '#222'}` }}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
        {!canCharge && graded < 5 && (
          <div className="rounded-xl px-4 py-3 text-xs" style={{ background: '#FFD60011', border: '1px solid #FFD60033', color: '#FFD600' }}>
            You need 5 graded picks before you can charge. You have {graded}/5 so far. You can still post free picks!
          </div>
        )}

        {/* Bet slip header */}
        <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #00C85333' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00C853' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00C853' }}>Bet Slip</span>
          </div>
          <div>
            <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Pick Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Monday Night NFL Hammer"
              className="w-full rounded-lg px-3 py-2 text-sm text-white font-semibold placeholder-[#444] outline-none"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Sport</label>
              <select
                value={sport}
                onChange={e => setSport(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
              >
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">
                Price {!canCharge && '(5 picks req.)'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#555]" />
                <input
                  type="number"
                  min="0"
                  max="49.99"
                  step="0.99"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  disabled={!canCharge}
                  className="w-full rounded-lg pl-7 pr-3 py-2 text-xs text-white outline-none disabled:opacity-40"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
            <span className="text-[10px] text-[#555]">{legs.length} leg{legs.length !== 1 ? 's' : ''} • Total odds</span>
            <span className="font-mono font-bold text-[#00C853] text-lg">{totalOdds}</span>
          </div>
        </div>

        {/* Legs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Legs ({legs.length}/6)</h2>
            {legs.length < 6 && (
              <button onClick={addLeg} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#1A1A1A', color: '#00C853', border: '1px solid #00C85344' }}>
                <Plus className="w-3 h-3" /> Add Leg
              </button>
            )}
          </div>
          <div className="space-y-3">
            {legs.map((leg, i) => (
              <LegBuilder
                key={i}
                leg={leg}
                index={i}
                onChange={updated => updateLeg(i, updated)}
                onRemove={() => removeLeg(i)}
              />
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-2">Overall Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any overall context for this parlay..."
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-xs text-white placeholder-[#444] outline-none resize-none"
            style={{ background: '#141414', border: '1px solid #222' }}
          />
        </section>

        <div className="rounded-xl px-3 py-2 text-[10px]" style={{ background: '#1A1A1A', color: '#555' }}>
          Your pick will be reviewed by admin before going live. Platform takes 20% of paid picks; you keep 80%.
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !title || legs.length === 0}
          className="w-full font-bold py-4 rounded-full transition-all disabled:opacity-40"
          style={{ background: '#00C853', color: '#000', fontSize: '15px' }}
        >
          {submitting ? 'Submitting...' : <span className="flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Submit for Review</span>}
        </button>

        <p className="text-[11px] text-center pb-6" style={{ color: '#444' }}>
          Admin approval required before your pick goes live on the marketplace.
        </p>
      </main>
    </div>
  );
}