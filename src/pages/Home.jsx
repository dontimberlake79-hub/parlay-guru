import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RiskSelector from '../components/RiskSelector';
import SportFilter from '../components/SportFilter';
import ParlayCard from '../components/ParlayCard';

const tierConfig = {
  safe: { minLegs: 1, maxLegs: 3, winMin: 65, winMax: 85 },
  moderate: { minLegs: 4, maxLegs: 6, winMin: 35, winMax: 60 },
  risky: { minLegs: 7, maxLegs: 10, winMin: 10, winMax: 30 },
  extreme: { minLegs: 11, maxLegs: 16, winMin: 1, winMax: 8 },
};

export default function Home() {
  const [risk, setRisk] = useState('safe');
  const [sport, setSport] = useState('All Sports');
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateParlays = async () => {
    setLoading(true);
    const cfg = tierConfig[risk];
    const sportFilter = sport === 'All Sports' ? 'any major sport (NFL, NBA, MLB, NHL, Soccer, UFC, Tennis)' : sport;

    const prompt = `You are a sports parlay analyst. Generate exactly 4 unique parlay picks for ${sportFilter}.

Each parlay should have between ${cfg.minLegs} and ${cfg.maxLegs} legs.
Each parlay's estimated win probability should be between ${cfg.winMin}% and ${cfg.winMax}%.

For each parlay, provide realistic picks based on current knowledge of teams, players, and trends. Use American odds format.

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
                    confidence: { type: "number" }
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
      add_context_from_internet: true,
    });
    setParlays(res.parlays || []);
    setLoading(false);
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
              <h1 className="font-display font-bold text-lg text-foreground leading-tight">The Parlay Guru</h1>
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
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Sport</h2>
          <SportFilter selected={sport} onSelect={setSport} />
        </section>

        <Button
          onClick={generateParlays}
          disabled={loading}
          className="w-full h-12 font-display font-bold text-base gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating Parlays...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Parlays
            </>
          )}
        </Button>

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
            <p className="font-display font-bold text-foreground text-lg">{"Pick your risk & generate"}</p>
            <p className="text-sm text-muted-foreground mt-1">AI-powered parlays from safe plays to extreme longshots</p>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground/50 text-center pb-6">
          ParlayAI generates entertainment-only picks using AI analysis. No real money wagering. Not financial advice.
        </p>
      </main>
    </div>
  );
}