import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UFC', 'Tennis', 'Golf', 'Other'];

export default function WinCounter() {
  const [totalWins, setTotalWins] = useState(0);
  const [sportBreakdown, setSportBreakdown] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const animRef = useRef(null);

  const fetchWins = async () => {
    const parlays = await base44.entities.Parlay.filter({ status: 'won', published: true }, '-date', 500);
    // Only count parlays where every leg result is 'won' (or no legs graded yet but status is won)
    const fullyWon = parlays.filter(p => {
      if (!p.legs || p.legs.length === 0) return true;
      const gradedLegs = p.legs.filter(l => l.result);
      if (gradedLegs.length === 0) return true;
      return gradedLegs.every(l => l.result === 'won');
    });

    const count = fullyWon.length;
    setTotalWins(count);

    // Sport breakdown
    const breakdown = SPORTS.map(sport => ({
      sport,
      wins: fullyWon.filter(p => p.sport === sport).length
    })).filter(s => s.wins > 0).sort((a, b) => b.wins - a.wins);
    setSportBreakdown(breakdown);

    return count;
  };

  // Count-up animation
  const animateCount = (target) => {
    if (animRef.current) clearInterval(animRef.current);
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    animRef.current = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayCount(target);
        clearInterval(animRef.current);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);
  };

  useEffect(() => {
    fetchWins().then(count => animateCount(count));

    // Real-time subscription
    const unsub = base44.entities.Parlay.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        fetchWins().then(count => setDisplayCount(count));
      }
    });
    return () => {
      unsub();
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
        style={{ background: '#1A1A1A', border: '1px solid #222' }}
      >
        {/* Pulsing live dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00C853' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#00C853' }} />
        </span>

        <span className="font-mono font-bold" style={{ fontSize: '15px', color: '#00C853' }}>
          🏆 {displayCount.toLocaleString()}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: '#888' }}>
          Winning Parlays
        </span>
      </button>

      {/* Sport breakdown dropdown */}
      {expanded && sportBreakdown.length > 0 && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl z-50 min-w-[160px] shadow-xl"
          style={{ background: '#1A1A1A', border: '1px solid #2a2a2a' }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: '#222' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#555' }}>By Sport</p>
          </div>
          {sportBreakdown.map(s => (
            <div key={s.sport} className="flex items-center justify-between px-3 py-2 border-b last:border-0" style={{ borderColor: '#1e1e1e' }}>
              <span className="text-xs font-semibold text-white">{s.sport}</span>
              <span className="font-mono text-xs font-bold" style={{ color: '#00C853' }}>{s.wins} wins</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}