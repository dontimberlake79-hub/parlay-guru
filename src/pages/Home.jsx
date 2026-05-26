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
  const [sports, setSports] = useState([]);
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
  const wins = trackerRecords.filter(r => r.result === 'win').length;

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
    
    // Check for API error
    if (res?.data?.error) {
      console.error('API Error:', res.data.error);
      alert('Unable to load games: ' + res.data.error + '\n\nPlease check your API key or try again later.');
      setGames([]);
      setGamesLoading(false);
      return;
    }
    
    const fetched = res?.data?.games || [];
    console.log(`Loaded ${fetched.length} games from API`);
    
    // Filter to upcoming and live games (not just today)
    const now = Date.now();
    const upcomingGames = fetched.filter(g => {
      const gameTime = new Date(g.commenceTime).getTime();
      // Include games from last 2 hours (live) to next 7 days
      return gameTime >= (now - 2 * 60 * 60 * 1000) && gameTime <= (now + 7 * 24 * 60 * 60 * 1000);
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
      const cfg = tierConfig[risk];
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const allGames = gamesOverride || games;
      const filteredGames = allGames;
      const hasProps = includeProps && filteredGames.some((g) => g.playerProps?.length > 0);
      
      // Fetch player stats for all unique players in props
      const playerStatsCache = JSON.parse(sessionStorage.getItem('player_stats_cache') || '{}');
      const uniquePlayers = new Set();
      if (hasProps) {
        filteredGames.forEach(g => {
          g.playerProps?.forEach(prop => {
            const playerName = prop.playerName || prop.player;
            if (playerName) uniquePlayers.add(playerName);
          });
        });
      }
      
      const playerStatsMap = {};
      for (const playerName of uniquePlayers) {
        if (playerStatsCache[playerName]) {
          playerStatsMap[playerName] = playerStatsCache[playerName];
          continue;
        }
        try {
          const propExample = filteredGames.flatMap(g => g.playerProps || []).find(p => (p.playerName || p.player) === playerName);
          if (!propExample) continue;
          const res = await base44.functions.invoke('getPlayerStats', {
            playerName,
            propLine: propExample.line || propExample.over?.line || propExample.under?.line || '',
            propType: propExample.type || 'Points'
          });
          if (res?.data?.stats) {
            playerStatsMap[playerName] = res.data.stats;
            playerStatsCache[playerName] = res.data.stats;
          }
        } catch (err) {
          console.error(`Failed to fetch stats for ${playerName}:`, err);
        }
      }
      sessionStorage.setItem('player_stats_cache', JSON.stringify(playerStatsCache));
      
      let oddsContext = '';
      if (filteredGames.length > 0) {
        oddsContext = '\n\nHere are REAL live odds. Use ONLY these games and odds:\n' +
          JSON.stringify(filteredGames, null, 2) + '\n\nYou MUST build parlays using only these games.';
      }
      
      // Add player stats context
      let playerStatsContext = '';
      if (Object.keys(playerStatsMap).length > 0) {
        playerStatsContext = '\n\nPLAYER RECENT FORM (Last 10 Games):\n' +
          JSON.stringify(playerStatsMap, null, 2) +
          '\n\nUse this data to provide SPECIFIC reasoning for each player prop leg. Mention exact over/under hit rates (e.g., "Hit 7/10 last games").';
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
        ? '\n7. EXACT 4-LEG MIX (MANDATORY): Leg 1: Moneyline (team to win outright). Leg 2: Alternate line (e.g. "Jalen Brunson 30+ Points"). Leg 3: Standard player prop over (e.g. "Wemby Over 19.5 Points"). Leg 4: Spread OR second player prop. NEVER more than 2 over/under legs total.'
        : '\n7. Since no prop data is loaded, still try to include at least one player-specific angle per parlay where possible.';
      
      const prompt = `You are an expert sports betting analyst with deep knowledge of player performance, line value, and parlay construction. Today is ${today}. Games span through ${weekEnd}. Generate exactly 8 parlays.

${filteredGames.length > 0 ? 'Use ONLY the real live odds data provided below. Do not invent games or odds.' : 'No live odds data available.'}

YOUR TASK:
Analyze the available games, player props, moneylines, and alternate lines. For each parlay, intelligently select the best 4-leg combination based on:
1. Line value (compare odds to expected probability)
2. Player recent form and matchups
3. Odds correlation (avoid voided combinations)
4. Balance and risk management

MANDATORY RULES:
1. Only use REAL games and odds from the data provided.
2. EXACT 4-LEG STRUCTURE: 1 moneyline + 1 alternate line + 1 standard player prop over + 1 spread OR second player prop.
3. ODDS SWEET SPOT: Prioritize individual legs with odds between -150 and +150. NEVER include any leg worse than +350 or shorter than -250.
4. AVOID CORRELATED LEGS: Do NOT combine a team moneyline with that same team covering a large spread (sportsbooks void these). Do NOT combine player props that are directly correlated (e.g., a QB's passing yards with a receiver's receiving yards from the same team).
5. ALTERNATE LINE FORMATTING: Display as "Player Name X+ Points" (e.g. "Jalen Brunson 30+ Points"). Round lines UP to nearest whole number.
6. NO PLAYER REPETITION: Never repeat the same player in the same parlay.
7. GAME DISTRIBUTION: Maximum 2 legs from the same game.
8. EXCITING TITLES: Create human, exciting titles like "The Sunday Hammer", "Knicks Revenge Slip", "Wemby Takeover", "Brunson Masterclass". NOT just game names.
9. VALUE RATING: Assign 1-5 stars based on average leg odds quality and line value. 5 stars = exceptional value (all legs -130 to +130). 4 stars = good value. 3 stars = average. 2 stars = risky. 1 star = very risky.
10. LEG REASONING: For EACH leg, provide ONE sentence explaining why this pick has value using the PLAYER RECENT FORM data if available (e.g., "Brunson has gone over 6.5 assists in 7 of his last 10 games", "Hit 8/10 last games"). If no stats available, reason based on odds and line value alone.
11. Calculate winProbability (0-100) by converting American odds to implied probability and multiplying all legs together.
12. Total odds must be ${cfg.oddsLabel}.${risk === 'chasing' ? ' Odds must be between +2500 and +12000.' : risk === 'bussin' ? ' Odds must be between +150 and +750.' : ` Do not exceed +${cfg.maxOdds} total odds.`}

${oddsContext}
${playerStatsContext}

Return JSON matching this schema exactly.`;

      const schema = {
        type: "object",
        properties: {
          parlays: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Exciting, human-sounding title like 'The Sunday Hammer' or 'Wemby Takeover'" },
                sport: { type: "string" },
                totalOdds: { type: "string" },
                winProbability: { type: "number", description: "Calculated win probability percentage (0-100)" },
                valueRating: { type: "number", description: "1-5 stars based on odds quality and line value" },
                reasoning: { type: "string", description: "Overall parlay strategy explanation" },
                legs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pick: { type: "string" },
                      matchup: { type: "string" },
                      odds: { type: "string" },
                      confidence: { type: "number" },
                      isPlayerProp: { type: "boolean" },
                      legReason: { type: "string", description: "One sentence explaining why this leg has value, including recent form if available (e.g., 'Hit 7/10 last games')" },
                      hotStreak: { type: "number", description: "0 = none, 1 = fire (7-8/10), 2 = double fire (9-10/10)", enum: [0, 1, 2] },
                      overCount: { type: "number", description: "How many times player went over in last 10 games" },
                      overPercentage: { type: "number", description: "Percentage of games player went over (0-100)" }
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
        add_context_from_internet: false,
        model: 'claude_sonnet_4_6'
      });
      console.log('LLM response:', res);
      const parlaysData = res.response?.parlays || res.parlays || [];
      const newParlays = parlaysData.map(p => ({
        ...p,
        legs: p.legs || []
      }));
      console.log('Processed parlays with legs:', newParlays);
      const sortedParlays = [...newParlays].sort((a, b) => (b.valueRating || 0) - (a.valueRating || 0));
      setParlays(sortedParlays);
      const newRecords = [];
      for (const p of newParlays) {
        const dbRecord = await base44.entities.ParlayRecord.create({
          title: p.title,
          sport: p.sport,
          totalOdds: p.totalOdds,
          legs: p.legs || [],
          date: new Date().toISOString()
        });
        console.log('Created DB record:', dbRecord);
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
    <div className="min-h-screen font-inter relative">
      <AnimatedBackground />
      <ScrollingTicker />
      
      <header className="border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/90">
        <div className="max-w-[430px] mx-auto px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/20">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display tracking-widest leading-tight" style={{ fontSize: 'clamp(20px, 5vw, 42px)', color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)', letterSpacing: '0.05em' }}>The Parlay Guru</h1>
                <p className="text-[10px] text-muted-foreground">AI-Generated Pick Slips • Entertainment Only</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Wins</p>
                <p className="font-display text-primary" style={{ fontSize: '18px', letterSpacing: '0.05em' }}>{wins}</p>
              </div>
              <StreakTracker />
              <CountdownTimer />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="font-display text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary" style={{ fontSize: 'clamp(22px, 6vw, 48px)', letterSpacing: '0.05em', lineHeight: 1 }}>Today's AI Picks Are Ready 🔥</h2>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/history" className="font-semibold text-muted-foreground hover:text-accent px-2 py-1 rounded-lg bg-secondary/50 border border-border/50 transition-all" style={{ fontSize: '11px' }}>
                History
              </Link>
              <Link to="/import" className="font-semibold text-muted-foreground hover:text-accent px-2 py-1 rounded-lg bg-secondary/50 border border-border/50 transition-all" style={{ fontSize: '11px' }}>
                Import
              </Link>
              <Link to="/dashboard" className="font-semibold text-muted-foreground hover:text-accent px-2 py-1 rounded-lg bg-secondary/50 border border-border/50 transition-all" style={{ fontSize: '11px' }}>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
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
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <button
              key={n}
              onClick={() => setLegCount(n)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                legCount === n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {n === 1 ? 'Straight' : `${n}-Leg`}
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
          className="group relative w-full rounded-xl font-display font-bold gap-3 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" style={{ height: '52px', borderRadius: '12px' }}
        >
          <div className="absolute inset-0" style={{ background: '#FFD700' }} />
          <span className="relative z-10 flex items-center justify-center gap-3 text-black drop-shadow-lg">
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-display" style={{ fontSize: '26px', letterSpacing: '0.05em' }}>AI is Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="font-display" style={{ fontSize: '26px', letterSpacing: '0.05em' }}>Generate My Picks 🔥</span>
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