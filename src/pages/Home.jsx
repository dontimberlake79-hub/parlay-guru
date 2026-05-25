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

const tierConfig = {
  safe: { maxOdds: 250, oddsLabel: 'Max +250', winMin: 60, winMax: 85 },
  moderate: { maxOdds: 550, oddsLabel: 'Max +550', winMin: 30, winMax: 55 },
  risky: { maxOdds: 1200, oddsLabel: 'Max +1200', winMin: 8, winMax: 25 },
  extreme: { maxOdds: 2500, oddsLabel: 'Max +2500', winMin: 2, winMax: 8 },
  chasing: { maxOdds: 12000, oddsLabel: '+2500 to +12000', winMin: 0, winMax: 2 },
  bussin: { maxOdds: 750, minOdds: 150, oddsLabel: '+150 to +750', winMin: 15, winMax: 40, legs: 4 }
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
  const [sports, setSports] = useState(['NBA', 'MLB', 'NFL']);
  const [includeProps, setIncludeProps] = useState(true);
  const [legCount, setLegCount] = useState(0);
  const [sameGame, setSameGame] = useState(false);

  const [games, setGames] = useState([]);
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [liveOnly, setLiveOnly] = useState(true);
  const [cacheLoading, setCacheLoading] = useState(false);

  useEffect(() => {
    loadGames(true);
  }, []);

  useEffect(() => {
    const alreadyCached = sessionStorage.getItem('props_cache');
    if (alreadyCached) return;
    setCacheLoading(true);
    base44.functions.invoke('getOdds', { sports, includeProps: true })
      .then((res) => {
        const fetched = res?.data?.games || [];
        sessionStorage.setItem('props_cache', JSON.stringify(fetched));
      })
      .finally(() => setCacheLoading(false));
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
    const fetched = res?.data?.games || [];
    const today = new Date().toDateString();
    const todayGames = fetched.filter(g => new Date(g.commenceTime).toDateString() === today);
    setGames(todayGames);
    setSelectedGameIds(todayGames.map((g) => g.id));
    sessionStorage.setItem('props_cache', JSON.stringify(todayGames));
    setGamesLoading(false);
    if (autoGenerate) {
      setTimeout(() => generateParlaysWithGames(todayGames), 100);
    }
  };

  const generateParlaysWithGames = async (gamesOverride) => {
    setLoading(true);
    try {
      const cfg = tierConfig[risk];
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const allGames = gamesOverride || games;
      const filteredGames = allGames;
      const hasProps = includeProps && filteredGames.some((g) => g.playerProps?.length > 0);
      let oddsContext = '';
      if (filteredGames.length > 0) {
        oddsContext = '\n\nHere are REAL live odds. Use ONLY these games and odds:\n' +
          JSON.stringify(filteredGames, null, 2) + '\n\nYou MUST build parlays using only these games.';
      }
      const legRule = legCount > 0
        ? `\n8. Each parlay must have EXACTLY ${legCount} legs. No more, no less.`
        : '\n8. Choose as many legs as needed to hit the target odds range (typically 2-6 legs).';
      const sameGameRule = sameGame && risk === 'bussin'
        ? '\n10. SAME GAME PARLAY MODE: ALL 4 legs MUST be from the SAME game (e.g. all from Lakers vs Celtics). Combine player props + moneyline + spread from one game only.'
        : sameGame
        ? '\n10. SAME GAME PARLAY MODE: All legs must be from the SAME game. Combine multiple player props or player props + moneyline from one matchup.'
        : '';
      const bussinRule = risk === 'bussin'
        ? '\n11. BUSSIN MODE: Exactly 4 legs per parlay. Total odds must be between +150 and +750. Mix: 2 player props + 1 moneyline + 1 spread/alternate.'
        : '';
      const propsRule = hasProps
        ? '\n7. PLAYER PROPS ARE MANDATORY. Each parlay must have EXACTLY this mix: 2 player props (points, assists, rebounds, threes, blocks, steals) + 1 moneyline (team to win) + 1 spread/alternate line. NEVER generate all overs/unders with no player names. Use REAL player names from the description field (e.g. "Victor Wembanyama Over 19.5 Points", "Jalen Brunson Over 6.5 Assists"). Skip any prop without a real player name in the description.'
        : '\n7. Since no prop data is loaded, still try to include at least one player-specific angle per parlay where possible.';
      
      const prompt = `You are a sports pick analyst who SPECIALIZES in player prop predictions. Today is ${today}. Games span through ${weekEnd}.

${filteredGames.length > 0 ? 'Use ONLY the real live odds data provided below. Do not invent games or odds.' : `Search the internet for real games TODAY for ${sports.join(', ')}.`}

Generate exactly 20 unique pick slip suggestions with EXCITING, SPECIFIC legs like "Wemby 20+ points" or "Jalen Brunson 7+ assists".

MANDATORY RULES:
1. Only use REAL games from the data provided.
2. Use exact real team and player names.
3. Include the actual game date and time in the matchup field.
4. CRITICAL ODDS RULE: Total pick slip odds must be ${cfg.oddsLabel} in American odds format.${risk === 'chasing' ? ' Odds must be between +2500 and +12000.' : risk === 'bussin' ? ' Odds must be between +150 and +750.' : ` Do not exceed +${cfg.maxOdds} total odds.`}
5. EACH PICK SLIP MUST HAVE THIS MIX: 2 player props (points/assists/rebounds/threes) + 1 moneyline (team to win) + 1 spread/alternate line. NEVER all overs/unders with no player names.${risk === 'bussin' ? ' EXACTLY 4 LEGS PER PICK SLIP.' : ''}
6. Calculate winProbability (0-100) for each pick slip based on the odds and leg difficulty. Use this formula: convert American odds to implied probability, multiply all legs together. Target range: ${cfg.winMin}%-${cfg.winMax}%.${propsRule}${legRule}
7. For player props, use format: "Player Name — Stat — Over/Under Line" (e.g. "Victor Wembanyama — Points — Over 19.5", "Jalen Brunson — Assists — Over 6.5").
8. Filter out ANY prop without a real player name in description — skip generic "Over/Under" with no player.
9. Display each leg clearly: Player Name, Stat type, Line, Odds (e.g. "Jalen Brunson — Assists — Over 6.5 — (-115)").${sameGameRule}${bussinRule}

Factor in current form, injuries, home/away records, and recent player performance stats.${oddsContext}

Return JSON matching this schema exactly.`;

      const schema = {
        type: "object",
        properties: {
          parlays: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                sport: { type: "string" },
                totalOdds: { type: "string" },
                winProbability: { type: "number", description: "Calculated win probability percentage (0-100) based on odds" },
                reasoning: { type: "string" },
                legs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pick: { type: "string" },
                      matchup: { type: "string" },
                      odds: { type: "string" },
                      confidence: { type: "number" },
                      isPlayerProp: { type: "boolean" }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
        add_context_from_internet: filteredGames.length === 0,
        model: 'gemini_3_flash'
      });
      const newParlays = res.parlays || [];
      setParlays(newParlays);
      const newRecords = [];
      for (const p of newParlays) {
        const dbRecord = await base44.entities.ParlayRecord.create({
          title: p.title,
          sport: p.sport,
          totalOdds: p.totalOdds,
          legs: p.legs || [],
          date: new Date().toISOString()
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
    <div className="min-h-screen font-inter relative">
      <AnimatedBackground />
      <ScrollingTicker />
      
      <header className="border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/90">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/20">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-accent leading-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>The Parlay Guru</h1>
                <p className="text-[10px] text-muted-foreground">AI-Generated Pick Slips • Entertainment Only</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StreakTracker />
              <CountdownTimer />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Today's AI Picks Are Ready 🔥</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/history" className="text-xs font-semibold text-muted-foreground hover:text-accent px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 transition-all">
                History
              </Link>
              <Link to="/import" className="text-xs font-semibold text-muted-foreground hover:text-accent px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 transition-all">
                Import
              </Link>
              <Link to="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-accent px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 transition-all">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {cacheLoading && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Fetching live prop markets...
          </div>
        )}

        <DailyFreePick />

        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Risk Level</h2>
          <RiskSelector selected={risk} onSelect={setRisk} />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sports Combo</h2>
            <span className="text-[10px] text-muted-foreground/50">(pick multiple)</span>
          </div>
          <SportFilter selected={sports} onToggle={toggleSport} />

          <div className="flex items-center gap-2 mt-3 mb-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Legs per Parlay</h2>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
              <button
                key={n}
                onClick={() => setLegCount(n)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  legCount === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {n === 0 ? 'Auto' : n === 1 ? 'Straight' : `${n}-Leg`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIncludeProps((p) => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                includeProps
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {includeProps ? '✓' : '+'} Player Props
            </button>

            <button
              onClick={() => setSameGame((p) => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                sameGame
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
              }`}
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
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Games</h2>
              <button
                onClick={() => setLiveOnly((p) => !p)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                  liveOnly
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
                }`}
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
          className="group relative w-full h-16 rounded-xl font-display font-bold text-lg gap-3 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent" />
          <span className="relative z-10 flex items-center justify-center gap-3 text-primary-foreground drop-shadow-lg">
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>AI is Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Generate My Picks 🔥</span>
              </>
            )}
          </span>
        </button>

        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
        `}</style>

        {trackerRecords.length > 0 && (
          <ParlayTracker records={trackerRecords} onMark={markResult} />
        )}

        {parlays.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Pick Slips</h2>
              <span className="text-xs text-muted-foreground">{parlays.length} picks</span>
            </div>
            {parlays.map((p, i) => (
              <ParlayCard key={i} parlay={p} tier={risk} />
            ))}
          </section>
        )}

        {parlays.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-display font-bold text-foreground text-lg">Pick your sports and generate</p>
            <p className="text-sm text-muted-foreground mt-1">Load games to pick specific matchups, or generate directly</p>
          </div>
        )}

        <WinningParlays />

        <TopParlays />

        <section>
          <CommunityFeed />
        </section>

        <p className="text-[11px] text-muted-foreground/50 text-center pb-6">
          The Parlay Guru generates entertainment-only picks. No real money wagering. Not financial advice.
        </p>
      </main>
      <DisclaimerModal />
    </div>
  );
}