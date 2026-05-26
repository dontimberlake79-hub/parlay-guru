import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedBackground from '../components/AnimatedBackground';
import ScrollingTicker from '../components/ScrollingTicker';
import CountdownTimer from '../components/CountdownTimer';
import StreakTracker from '../components/StreakTracker';
import DailyFreePick from '../components/DailyFreePick';
import RiskSelector from '../components/RiskSelector';
import SportFilter from '../components/SportFilter';
import UpcomingGames from '../components/UpcomingGames.jsx';
import ParlayCard from '../components/ParlayCard';
import ParlayTracker from '../components/ParlayTracker';
import CommunityFeed from '../components/CommunityFeed';
import TopParlays from '../components/TopParlays';
import WinningParlays from '../components/WinningParlays';
import DisclaimerModal from '../components/DisclaimerModal';
import WinCounter from '../components/WinCounter';
import { generateFakeParlays } from '../utils/generateParlays';

const tierConfig = {
  safe: { maxOdds: 250, oddsLabel: 'Max +250', winMin: 60, winMax: 85 },
  moderate: { maxOdds: 550, oddsLabel: 'Max +550', winMin: 30, winMax: 55 },
  risky: { maxOdds: 1200, oddsLabel: 'Max +1200', winMin: 8, winMax: 25 },
  extreme: { maxOdds: 2500, oddsLabel: 'Max +2500', winMin: 2, winMax: 8 },
  chasing: { maxOdds: 12000, oddsLabel: '+2500 to +12000', winMin: 0, winMax: 2 },

};

const LS_KEY = 'parlay_tracker';

function loadTrackerFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function Home() {
  const [risk, setRisk] = useState('safe');
  const [sports, setSports] = useState([]);
  const [includeProps, setIncludeProps] = useState(false);
  const [legCount, setLegCount] = useState(0);
  const [sameGame, setSameGame] = useState(false);

  const [games, setGames] = useState([]);
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [liveOnly, setLiveOnly] = useState(true);


  useEffect(() => {
    loadGames(true);
  }, []);



  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackerRecords, setTrackerRecords] = useState(loadTrackerFromStorage);

  useEffect(() => {
    base44.entities.ParlayRecord.list('-created_date', 50).then((records) => {
      if (records?.length) {
        setTrackerRecords(records);
        localStorage.setItem(LS_KEY, JSON.stringify(records));
      }
    }).catch(() => {});
  }, []);

  const toggleSport = (sport) => {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
    setGames([]);
    setSelectedGameIds([]);
  };

  const toggleGameId = (id) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const loadGames = async (autoGenerate = false) => {
    setGamesLoading(true);
    const res = await base44.functions.invoke('getOdds', { sports, includeProps });
    if (res?.data?.error) {
      console.error('API Error:', res.data.error);
      alert('Unable to load games: ' + res.data.error + '\n\nPlease check your API key or try again later.');
      setGames([]);
      setGamesLoading(false);
      return;
    }
    const fetched = res?.data?.games || [];
    const now = Date.now();
    const upcomingGames = fetched.filter(g => {
      const gameTime = new Date(g.commenceTime).getTime();
      // Only show games starting within the last 2 hours or next 48 hours, AND that have odds
      const inWindow = gameTime >= (now - 2 * 60 * 60 * 1000) && gameTime <= (now + 48 * 60 * 60 * 1000);
      const hasOdds = g.odds && g.odds.length > 0;
      return inWindow && hasOdds;
    });
    setGames(upcomingGames);
    setSelectedGameIds(upcomingGames.map((g) => g.id));
    sessionStorage.setItem('props_cache', JSON.stringify(upcomingGames));
    setGamesLoading(false);
    if (autoGenerate) {
      setTimeout(() => generateParlaysWithGames(upcomingGames), 100);
    }
  };

  const generateParlaysWithGames = async (gamesOverride) => {
    setLoading(true);
    try {
      const allGames = gamesOverride || games;
      const filteredGames = allGames.filter(g => selectedGameIds.length === 0 || selectedGameIds.includes(g.id));

      const newParlays = generateFakeParlays(filteredGames, risk);
      const typeOrder = { quick_hit: 0, main_slate: 1, power_parlay: 2 };
      const sortedParlays = [...newParlays].sort((a, b) => (typeOrder[a.parlayType] ?? 1) - (typeOrder[b.parlayType] ?? 1) || (b.valueRating || 0) - (a.valueRating || 0));
      setParlays(sortedParlays);

      const newRecords = [];
      for (const p of newParlays) {
        const dbRecord = await base44.entities.ParlayRecord.create({
          title: p.title,
          sport: p.sport,
          totalOdds: p.totalOdds,
          legs: p.legs || [],
          date: new Date().toISOString(),
          parlayType: p.parlayType || 'main_slate'
        });
        newRecords.push({ ...dbRecord, result: null });
      }
      setTrackerRecords(prev => {
        const updated = [...newRecords, ...prev].slice(0, 50);
        localStorage.setItem(LS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Generate error:', err);
      alert('Error generating picks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateParlays = async () => {
    if (games.length === 0) {
      await loadGames(true);
    } else {
      await generateParlaysWithGames(games);
    }
  };

  const markResult = async (id, result) => {
    const updated = trackerRecords.map((r) => r.id === id ? { ...r, result } : r);
    setTrackerRecords(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    try {
      await base44.entities.ParlayRecord.update(id, { result });
    } catch (_) {}
  };

  return (
    <div className="min-h-screen font-inter relative" style={{ background: '#0D0D0D' }}>
      <AnimatedBackground />
      <ScrollingTicker />

      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: '#111', borderColor: '#222' }}>
        <div className="max-w-[430px] mx-auto px-3 py-3">
          {/* Top row: logo + counters */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <img
                src="https://media.base44.com/images/public/6a137b383d31ca94e286bdc5/98a9ee019_ChatGPTImageMay25202608_11_33PM.png"
                alt="Parlay Guru"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div>
                <h1 className="font-display tracking-widest leading-tight" style={{ fontSize: 'clamp(18px, 5vw, 36px)', color: '#FFD600', letterSpacing: '0.05em' }}>Parlay Guru</h1>
                <p className="text-[10px]" style={{ color: '#555' }}>AI Pick Slips • Entertainment Only</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <WinCounter />
              <StreakTracker />
              <CountdownTimer />
            </div>
          </div>

          {/* Bottom row: subtitle + nav links */}
          <div className="flex items-center justify-between">
            <h2 className="font-display" style={{ fontSize: 'clamp(16px, 4vw, 28px)', letterSpacing: '0.05em', lineHeight: 1, color: '#fff' }}>
              Today's Picks Are Ready 🔥
            </h2>
            <div className="flex items-center gap-1">
              <Link to="/history" className="font-semibold px-2 py-1 rounded transition-all" style={{ fontSize: '11px', background: '#1A1A1A', color: '#666', border: '1px solid #222' }}>History</Link>
              <Link to="/stats" className="font-semibold px-2 py-1 rounded transition-all" style={{ fontSize: '11px', background: '#1A1A1A', color: '#666', border: '1px solid #222' }}>Stats</Link>
              <Link to="/admin" className="font-semibold px-2 py-1 rounded transition-all" style={{ fontSize: '11px', background: '#1A1A1A', color: '#666', border: '1px solid #222' }}>Admin</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">


        <DailyFreePick />

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Risk Level</h2>
          <RiskSelector selected={risk} onSelect={setRisk} />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Sports Combo</h2>
            <span className="text-[10px]" style={{ color: '#444' }}>(pick multiple)</span>
          </div>
          <SportFilter selected={sports} onToggle={toggleSport} />

          <div className="flex items-center gap-2 mt-3 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Legs per Parlay</h2>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <button
                key={n}
                onClick={() => setLegCount(n)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: legCount === n ? '#00C853' : '#1A1A1A',
                  color: legCount === n ? '#000' : '#666',
                  border: `1px solid ${legCount === n ? '#00C853' : '#222'}`
                }}
              >
                {n === 1 ? 'Straight' : `${n}-Leg`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIncludeProps((p) => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: includeProps ? '#FFD60015' : '#1A1A1A',
                color: includeProps ? '#FFD600' : '#666',
                border: `1px solid ${includeProps ? '#FFD60040' : '#222'}`
              }}
            >
              {includeProps ? '✓' : '+'} Player Props
            </button>

            <button
              onClick={() => setSameGame((p) => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: sameGame ? '#00C85315' : '#1A1A1A',
                color: sameGame ? '#00C853' : '#666',
                border: `1px solid ${sameGame ? '#00C85330' : '#222'}`
              }}
            >
              {sameGame ? '🔒' : '➕'} Same Game
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadGames}
              disabled={gamesLoading || !sports.length}
              className="gap-1.5 text-xs h-8"
            >
              {gamesLoading ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Loading...</>
              ) : (
                <><Search className="w-3 h-3" /> Load Games</>
              )}
            </Button>
          </div>
        </section>

        {games.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Select Games</h2>
              <button
                onClick={() => setLiveOnly((p) => !p)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: liveOnly ? '#00C85315' : '#1A1A1A',
                  color: liveOnly ? '#00C853' : '#666',
                  border: `1px solid ${liveOnly ? '#00C85330' : '#222'}`
                }}
              >
                {liveOnly ? '● ' : '○ '}Books Open
              </button>
            </div>
            <UpcomingGames
              games={liveOnly ? games.filter((g) => g.odds && g.odds.length > 0) : games}
              selected={selectedGameIds}
              onToggle={toggleGameId}
            />
          </section>
        )}

        <button
          onClick={generateParlays}
          disabled={loading || !sports.length}
          className="w-full rounded-full font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ height: '52px', background: '#00C853', color: '#000', fontSize: '16px', letterSpacing: '0.05em', fontWeight: 800 }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Building Picks...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              GENERATE MY PICKS 🔥
            </span>
          )}
        </button>



        {parlays.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Your Pick Slips</h2>
              <span className="text-xs" style={{ color: '#555' }}>{parlays.length} picks</span>
            </div>
            {parlays.map((p, i) => (
              <ParlayCard key={i} parlay={p} tier={risk} />
            ))}
          </section>
        )}

        {parlays.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#1A1A1A' }}>
              <Sparkles className="w-7 h-7" style={{ color: '#444' }} />
            </div>
            <p className="font-semibold text-white text-base">Pick your sports and generate</p>
            <p className="text-sm mt-1" style={{ color: '#555' }}>Load games to pick specific matchups, or generate directly</p>
          </div>
        )}

        <WinningParlays />
        <TopParlays />

        <section>
          <CommunityFeed />
        </section>

        <p className="text-[11px] text-center pb-6" style={{ color: '#444' }}>
          The Parlay Guru generates entertainment-only picks. No real money wagering. Not financial advice.
        </p>
      </main>
      <DisclaimerModal />
    </div>
  );
}