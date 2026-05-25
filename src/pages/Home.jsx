import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Sparkles, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RiskSelector from '../components/RiskSelector';
import SportFilter from '../components/SportFilter';
import GameSelector from '../components/GameSelector';
import UpcomingGames from '../components/UpcomingGames.jsx';
import ParlayCard from '../components/ParlayCard';
import ParlayTracker from '../components/ParlayTracker';
import CommunityFeed from '../components/CommunityFeed';
import TopParlays from '../components/TopParlays';
import WinningParlays from '../components/WinningParlays';

const tierConfig = {
  safe: { maxOdds: 250, oddsLabel: 'Max +250', winMin: 60, winMax: 85 },
  moderate: { maxOdds: 550, oddsLabel: 'Max +550', winMin: 30, winMax: 55 },
  risky: { maxOdds: 1200, oddsLabel: 'Max +1200', winMin: 8, winMax: 25 },
  extreme: { maxOdds: 2500, oddsLabel: 'Max +2500', winMin: 2, winMax: 8 },
  chasing: { maxOdds: 12000, oddsLabel: '+2500 to +12000', winMin: 0, winMax: 2 }
};

const LS_KEY = 'parlay_tracker';

function loadTrackerFromStorage() {
  try {return JSON.parse(localStorage.getItem(LS_KEY) || '[]');} catch {return [];}
}

export default function Home() {
  const [risk, setRisk] = useState('safe');
  const [sports, setSports] = useState(['NBA']);
  const [includeProps, setIncludeProps] = useState(true);
  const [legCount, setLegCount] = useState(0); // 0 = auto

  const [games, setGames] = useState([]);
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [liveOnly, setLiveOnly] = useState(true);

  useEffect(() => {
    loadGames(false);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadGames = async (autoGenerate = false) => {
    setGamesLoading(true);
    const res = await base44.functions.invoke('getOdds', { sports, includeProps });
    const fetched = res?.data?.games || [];
    setGames(fetched);
    setSelectedGameIds(fetched.map((g) => g.id));
    sessionStorage.setItem('propsCache', JSON.stringify(fetched));
    setGamesLoading(false);
    if (autoGenerate) {
      // small delay so state settles before generating
      setTimeout(() => generateParlaysWithGames(fetched), 100);
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
      const propsRule = hasProps ?
        '\n7. PLAYER PROPS ARE MANDATORY. At least 60% of all parlays must be built ENTIRELY from player props. Every parlay must have a minimum of 3 player prop legs (points over/under, rebounds, assists, passing yards, rushing yards, receiving yards, strikeouts, goals, shots on goal, etc.). Do NOT rely on moneylines or spreads — player props are the PRIMARY bet type. Use real player names and real stat lines from the provided odds data.' :
        '\n7. Since no prop data is loaded, still try to include at least one player-specific angle per parlay where possible.';
      const prompt = `You are a sports parlay analyst who SPECIALIZES in player prop bets. Today is ${today}. Games span through ${weekEnd}.\n\n${filteredGames.length > 0 ? 'Use ONLY the real live odds data provided below. Do not invent games or odds.' : `Search the internet for real games TODAY for ${sports.join(', ')}.`}\n\nGenerate exactly 20 unique parlay picks. The MAJORITY must be player prop parlays.\n\nMANDATORY RULES:\n1. Only use REAL games from the data provided.\n2. Use exact real team and player names.\n3. Include the actual game date and time in the matchup field.\n4. CRITICAL ODDS RULE: Total parlay payout must be ${cfg.oddsLabel} in American odds format.${risk === 'chasing' ? ' Odds must be between +2500 and +12000.' : ` Do not exceed +${cfg.maxOdds} total odds.`}\n5. Choose as many or as few legs as needed to hit the target odds range.\n6. Each parlay win probability should be between ${cfg.winMin}% and ${cfg.winMax}%.${propsRule}${legRule}\n9. At least 12 of the 20 parlays MUST be pure player prop parlays with NO moneylines — only player stat over/unders.\n10. For every player prop leg, clearly name the player, the stat (e.g. "LeBron James Over 27.5 Points"), and the odds.\n\nFactor in current form, injuries, home/away records, and recent player performance stats.${oddsContext}\n\nReturn JSON matching this schema exactly.`;
      const schema = { type: "object", properties: { parlays: { type: "array", items: { type: "object", properties: { title: { type: "string" }, sport: { type: "string" }, totalOdds: { type: "string" }, winProbability: { type: "number" }, reasoning: { type: "string" }, legs: { type: "array", items: { type: "object", properties: { pick: { type: "string" }, matchup: { type: "string" }, odds: { type: "string" }, confidence: { type: "number" }, isPlayerProp: { type: "boolean" } } } } } } } } };
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema, add_context_from_internet: filteredGames.length === 0, model: 'gemini_3_flash' });
      const newParlays = res.parlays || [];
      setParlays(newParlays);
      const newRecords = [];
      for (const p of newParlays) {
        const dbRecord = await base44.entities.ParlayRecord.create({ title: p.title, sport: p.sport, totalOdds: p.totalOdds, legs: p.legs || [], date: new Date().toISOString() });
        newRecords.push({ ...dbRecord, result: null });
      }
      setTrackerRecords(prev => { const updated = [...newRecords, ...prev].slice(0, 50); localStorage.setItem(LS_KEY, JSON.stringify(updated)); return updated; });
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateParlays = async () => {
    await generateParlaysWithGames(games);
  };

  const markResult = async (id, result) => {
    const updated = trackerRecords.map((r) => r.id === id ? { ...r, result } : r);
    setTrackerRecords(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    try {await base44.entities.ParlayRecord.update(id, { result });} catch (_) {}
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-[hsl(var(--background))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground leading-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>The Parlay Guru</h1>
              <p className="text-[11px] text-muted-foreground">Smart picks, no bets</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/history" className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary transition-all">
              History
            </Link>
            <Link to="/import" className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary transition-all">
              Import
            </Link>
            <Link to="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary transition-all">
              Dashboard
            </Link>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
              <AlertTriangle className="w-3 h-3 text-accent" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Entertainment Only</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

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
              includeProps ?
              'bg-accent/15 text-accent border-accent/40' :
              'bg-secondary text-muted-foreground border-transparent hover:text-foreground'}`
              }>
              
              {includeProps ? '✓' : '+'} Player Props
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadGames}
              disabled={gamesLoading || !sports.length}
              className="gap-1.5 text-xs h-8">
              
              {gamesLoading ?
              <><RefreshCw className="w-3 h-3 animate-spin" /> Loading...</> :
              <><Search className="w-3 h-3" /> Load Games</>
              }
            </Button>
          </div>
        </section>

        {games.length > 0 &&
        <section>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Games</h2>
              <button
              onClick={() => setLiveOnly((p) => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
              liveOnly ?
              'bg-primary/15 text-primary border-primary/30' :
              'bg-secondary text-muted-foreground border-transparent hover:text-foreground'}`
              }>
              
                {liveOnly ? '● ' : '○ '}Books Open
              </button>
            </div>
            <UpcomingGames
            games={liveOnly ? games.filter((g) => g.odds && g.odds.length > 0) : games}
            selected={selectedGameIds}
            onToggle={toggleGameId} />
          
          </section>
        }

        <Button
          onClick={generateParlays}
          disabled={loading || !sports.length}
          className="w-full h-12 font-display font-bold text-base gap-2">
          
          {loading ?
          <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Parlays...</> :
          <><Sparkles className="w-4 h-4" /> Generate Parlays</>
          }
        </Button>

        {trackerRecords.length > 0 &&
        <ParlayTracker records={trackerRecords} onMark={markResult} />
        }

        {parlays.length > 0 &&
        <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Parlays</h2>
              <span className="text-xs text-muted-foreground">{parlays.length} picks</span>
            </div>
            {parlays.map((p, i) =>
          <ParlayCard key={i} parlay={p} tier={risk} />
          )}
          </section>
        }

        {parlays.length === 0 && !loading &&
        <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-display font-bold text-foreground text-lg">Pick your sports and generate</p>
            <p className="text-sm text-muted-foreground mt-1">Load games to pick specific matchups, or generate directly</p>
          </div>
        }

        <WinningParlays />

        <TopParlays />

        <section>
          <CommunityFeed />
        </section>

        <p className="text-[11px] text-muted-foreground/50 text-center pb-6">
          The Parlay Guru generates entertainment-only picks. No real money wagering. Not financial advice.
        </p>
      </main>
    </div>);

}