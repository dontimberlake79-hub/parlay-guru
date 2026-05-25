import { useState, useEffect } from 'react';
import { Flame, Sparkles, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ParlayCard from './ParlayCard';
import { base44 } from '@/api/base44Client';

const LS_KEY = 'daily_pick_date';

export default function DailyFreePick() {
  const [dailyPick, setDailyPick] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(LS_KEY);

    if (lastShown !== today) {
      setShowNotification(true);
      localStorage.setItem(LS_KEY, today);
      setTimeout(() => setShowNotification(false), 5000);
    }

    const generateDailyPick = async () => {
      try {
        const cached = sessionStorage.getItem('props_cache');
        const games = cached ? JSON.parse(cached) : [];
        
        const prompt = `Generate ONE premium daily free pick parlay with 3-4 legs. This will be shown to ALL users (no account needed).

${games.length > 0 ? 'Use these real games:\n' + JSON.stringify(games.slice(0, 10), null, 2) : 'Search for today\'s top games online.'}

Create an exciting, accessible parlay that showcases quality analysis. Include:
- 2 player props with real player names
- 1 moneyline or spread
- Total odds between +400 and +800
- Win probability 25-40%

Return JSON: { title, sport, totalOdds, winProbability, legs: [{pick, matchup, odds}], reasoning }`;

        const schema = {
          type: 'object',
          properties: {
            title: { type: 'string' },
            sport: { type: 'string' },
            totalOdds: { type: 'string' },
            winProbability: { type: 'number' },
            legs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pick: { type: 'string' },
                  matchup: { type: 'string' },
                  odds: { type: 'string' }
                }
              }
            },
            reasoning: { type: 'string' }
          }
        };

        const res = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: schema,
          add_context_from_internet: games.length === 0,
          model: 'gemini_3_flash'
        });

        setDailyPick(res);
      } catch (err) {
        console.error('Daily pick error:', err);
      } finally {
        setLoading(false);
      }
    };

    generateDailyPick();
  }, []);

  if (loading || !dailyPick) return null;

  return (
    <>
      {showNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-accent/90 to-primary/90 text-primary-foreground shadow-2xl border-2 border-accent/50">
            <Flame className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-bold">Today's Free Pick is Ready!</span>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] border-2 border-accent/40 shadow-2xl shadow-accent/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                  Free Pick of the Day <Flame className="w-5 h-5 text-accent" />
                </h2>
                <p className="text-xs text-muted-foreground">No Account Needed — Share with Friends!</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => {
                navigator.clipboard.writeText(`Check out today's free pick from The Parlay Guru! ${dailyPick.title}`);
              }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          <ParlayCard parlay={dailyPick} tier="moderate" isDailyPick />
        </div>
      </section>
    </>
  );
}