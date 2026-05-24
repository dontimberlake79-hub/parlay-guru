import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Sparkles, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RiskSelector from '../components/RiskSelector';
import SportFilter from '../components/SportFilter';
import GameSelector from '../components/GameSelector';
import ParlayCard from '../components/ParlayCard';
import ParlayTracker from '../components/ParlayTracker';

const tierConfig = {
  safe:     { maxOdds: 250,   oddsLabel: 'Max +250',   winMin: 60, winMax: 85 },
  moderate: { maxOdds: 550,   oddsLabel: 'Max +550',   winMin: 30, winMax: 55 },
  risky:    { maxOdds: 1200,  oddsLabel: 'Max +1200',  winMin: 8,  winMax: 25 },
  extreme:  { maxOdds: 2500,  oddsLabel: 'Max +2500',  winMin: 2,  winMax: 8  },
  chasing:  { maxOdds: 12000, oddsLabel: '+2500 to +12000', winMin: 0, winMax: 2  },
};

const LS_KEY = 'parlay_tracker';

function loadTrackerFromStorage() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

export default function Home() {
  const [risk, setRisk] = useState('safe');
  const [sports, setSports] = useState(['NBA']);
  const [includeProps, setIncludeProps] = useState(false);

  const [games, setGames] = useState([]);
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(false);

  const [trackerRecords, setTrackerRecords] = useState(loadTrackerFromStorage);

  const toggleSport = (sport) => {
    setSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
    setGames([]);
    setSelectedGameIds([]);
  };

  const toggleGameId = (id) => {
    setSelectedGameIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const loadGames = async () => {
    setGamesLoading(true);
    const res = await base44.functions.invoke('getOdds', { sports, includeProps });
    const fetched = res?.data?.games || [];
    setGames(fetched);
    setSelectedGameIds(fetched.map(g => g.id));
    setGamesLoading(false);
  };

  const generateParlays = async () => {
    setLoading(true);
    const cfg = tierConfig[risk];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const filteredGames = selectedGameIds.length
      ? games.filter(g => selectedGameIds.includes(g.id))
      : games;

    const hasProps = includeProps && filteredGames.some(g => g.playerProps?.length > 0);

    let oddsContext = '';
    if (filteredGames.length > 0) {
      oddsContext = '\n\nHere are REAL live odds. Use ONLY these games and odds:\n' +
        JSON.stringify(filteredGames, null, 2) + '\n\nYou MUST build parlays using only these games.';
    }

    const propsRule = hasProps
      ? '\n7. Include at least one player prop bet per parlay when player props data is available (e.g. player points over/under, assists, strikeouts).'
      : '';

    const prompt = `You are a sports parlay analyst. Today is ${today}.

${filteredGames.length > 0
  ? 'Use ONLY the real live odds data provided below. Do not invent games or odds.'
  : `Search the internet for real games TODAY for ${sports.join(', ')}.`}

Generate exactly 4 unique parlay picks.

MANDATORY RULES:
1. Only use REAL games from the data provided.
2. Use exact real team and player names.
3. Include the actual game date and time in the matchup field.
4. CRITICAL ODDS RULE: Total parlay payout must be ${cfg.oddsLabel} in American odds format.${risk === 'chasing' ? ' Odds must be between +2500 and +12000.' : ` Do not exceed +${cfg.maxOdds} total odds.`}
5. Choose as many or as few legs as needed to hit the target odds range.
6. Each parlay win probability should be between ${cfg.winMin}% and ${cfg.winMax}%.${propsRule}

Factor in current form, injuries, home/away records, and head-to-head trends. Use American odds format.${oddsContext}

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
              winProbability: { type: "number" },
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
      model: 'gemini_3_flash',
    });

    const newParlays = res.parlays || [];
    setParlays(newParlays);

    // Add to tracker as pending
    const newRecords = newParlays.map((p, i) => ({
      id: `${Date.now()}-${i}`,
      title: p.title,
      totalOdds: p.totalOdds,
      result: null,
      date: new Date().toISOString(),
    }));
    const updated = [...newRecords, ...trackerRecords].slice(0, 50);
    setTrackerRecords(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setLoading(false);
  };

  const markResult = (id, result) => {
    const updated = trackerRecords.map(r => r.id === id ? { ...r, result } : r);
    setTrackerRecords(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground leading-tight" style={{fontFamily: "'Dancing Script', cursive"}}>The Parlay Guru</h1>
              <p className="text-[11px] text-muted-foreground">Smart picks, no bets</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
            <AlertTriangle className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Entertainment Only</span>
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

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button
              onClick={() => setIncludeProps(p => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                includeProps
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {includeProps ? '✓' : '+'} Player Props
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadGames}
              disabled={gamesLoading || !sports.length}
              className="gap-1.5 text-xs h-8"
            >
              {gamesLoading
                ? <><RefreshCw className="w-3 h-3 animate-spin" /> Loading...</>
                : <><Search className="w-3 h-3" /> Load Games</>
              }
            </Button>
          </div>
        </section>

        {games.length > 0 && (
          <section>
            <GameSelector
              games={games}
              selected={selectedGameIds}
              onToggle={toggleGameId}
            />
          </section>
        )}

        <Button
          onClick={generateParlays}
          disabled={loading || !sports.length}
          className="w-full h-12 font-display font-bold text-base gap-2"
        >
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Parlays...</>
            : <><Sparkles className="w-4 h-4" /> Generate Parlays</>
          }
        </Button>

        {trackerRecords.length > 0 && (
          <ParlayTracker records={trackerRecords} onMark={markResult} />
        )}

        {parlays.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Parlays</h2>
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

        <p className="text-[11px] text-muted-foreground/50 text-center pb-6">
          The Parlay Guru generates entertainment-only picks. No real money wagering. Not financial advice.
        </p>
      </main>
    </div>
  );
}