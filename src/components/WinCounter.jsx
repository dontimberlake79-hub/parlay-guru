import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UFC', 'Tennis', 'Golf', 'Other'];

function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) clearInterval(ref.current);
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    ref.current = setInterval(() => {
      current += increment;
      if (current >= target) { setDisplay(target); clearInterval(ref.current); }
      else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(ref.current);
  }, [target]);
  return display;
}

export default function WinCounter() {
  const [totalWins, setTotalWins] = useState(0);
  const [totalLegWins, setTotalLegWins] = useState(0);
  const [sportBreakdown, setSportBreakdown] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const displayWins = useCountUp(totalWins);
  const displayLegs = useCountUp(totalLegWins);

  const fetchWins = async () => {
    const [parlays, generatedWins] = await Promise.all([
      base44.entities.Parlay.filter({ status: 'won', published: true }, '-date', 500),
      base44.entities.ParlayRecord.filter({ result: 'win' }, '-created_date', 500),
    ]);

    const fullyWon = parlays.filter(p => {
      if (!p.legs || p.legs.length === 0) return true;
      const graded = p.legs.filter(l => l.result);
      if (graded.length === 0) return true;
      return graded.every(l => l.result === 'won');
    });

    setTotalWins(fullyWon.length + generatedWins.length);

    const allParlays = await base44.entities.Parlay.filter({ published: true }, '-date', 500);
    let legWins = 0;
    allParlays.forEach(p => {
      (p.legs || []).forEach(l => { if (l.result === 'won') legWins++; });
    });
    setTotalLegWins(legWins);

    const breakdown = SPORTS.map(sport => ({
      sport,
      wins: fullyWon.filter(p => p.sport === sport).length + generatedWins.filter(p => p.sport === sport).length
    })).filter(s => s.wins > 0).sort((a, b) => b.wins - a.wins);
    setSportBreakdown(breakdown);
  };

  useEffect(() => {
    fetchWins();
    const unsub = base44.entities.Parlay.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') fetchWins();
    });
    return () => unsub();
  }, []);

  if (totalWins === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex flex-col items-start px-3 py-1.5 rounded-lg transition-all"
        style={{ background: '#161B22', border: '1px solid #1E2533' }}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#16A34A' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#16A34A' }} />
          </span>
          <span className="font-mono font-bold" style={{ fontSize: '13px', color: '#16A34A' }}>
            {displayWins.toLocaleString()} Verified
          </span>
        </div>
        <p className="text-[9px] pl-4" style={{ color: '#9CA3AF' }}>Tracked Wins</p>
      </button>

      {expanded && sportBreakdown.length > 0 && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg z-50 min-w-[160px] shadow-lg"
          style={{ background: '#161B22', border: '1px solid #1E2533' }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: '#1E2533' }}>
            <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>By Sport</p>
          </div>
          {sportBreakdown.map(s => (
            <div key={s.sport} className="flex items-center justify-between px-3 py-2 border-b last:border-0" style={{ borderColor: '#1E2533' }}>
              <span className="text-xs font-semibold text-white">{s.sport}</span>
              <span className="font-mono text-xs font-semibold" style={{ color: '#16A34A' }}>{s.wins} wins</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}