import { useState } from 'react';
import { Trophy, X, Minus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

export default function ParlayTracker({ records, onMark }) {
  const [checking, setChecking] = useState(false);

  const wins = records.filter(r => r.result === 'win').length;
  const losses = records.filter(r => r.result === 'loss').length;
  const pending = records.filter(r => !r.result);

  if (!records.length) return null;

  const checkResults = async () => {
    if (!pending.length) return;
    setChecking(true);

    // Get all sports from pending parlays
    const sports = [...new Set(pending.map(r => r.sport).filter(Boolean))];
    const scoresRes = await base44.functions.invoke('getScores', { sports: sports.length ? sports : undefined });
    const scores = scoresRes?.data?.scores || [];
    if (!scores.length) { setChecking(false); return; }

    // Ask AI to evaluate each pending parlay against completed scores
    for (const record of pending) {
      if (!record.legs?.length) continue;
      const legsText = record.legs.map(l => `- ${l.pick} (${l.matchup})`).join('\n');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports result checker. Based on the completed game scores below, determine if the following parlay WON or LOST.

Parlay: "${record.title}"
Legs:
${legsText}

Completed game scores:
${JSON.stringify(scores, null, 2)}

A parlay wins only if ALL legs win. If any leg is inconclusive (game not found in scores), respond with "pending".
Respond with exactly one word: "win", "loss", or "pending".`,
        response_json_schema: {
          type: "object",
          properties: { result: { type: "string", enum: ["win", "loss", "pending"] } }
        }
      });
      const verdict = res?.result;
      if (verdict === 'win' || verdict === 'loss') {
        onMark(record.id, verdict);
      }
    }

    setChecking(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Parlay Tracker</h2>
        {pending.length > 0 && (
          <button
            onClick={checkResults}
            disabled={checking}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", checking && "animate-spin")} />
            {checking ? 'Checking...' : 'Check Results'}
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-primary">{wins}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Wins</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-red-400">{losses}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Losses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-muted-foreground">{pending.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
        </div>
        <div className="text-center ml-auto">
          <p className="text-2xl font-display font-bold text-accent">
            {wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">Hit Rate</p>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {records.filter(r => r.result === 'win').map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              r.result === 'win' ? 'bg-primary' : r.result === 'loss' ? 'bg-red-400' : 'bg-muted-foreground'
            )} />
            <span className="flex-1 truncate text-muted-foreground">{r.title}</span>
            <span className="text-accent font-bold">{r.totalOdds}</span>
            <div className="flex gap-1">
              <button
                onClick={() => onMark(r.id, 'win')}
                className={cn("p-1 rounded", r.result === 'win' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary')}
                title="Mark as Win"
              >
                <Trophy className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMark(r.id, 'loss')}
                className={cn("p-1 rounded", r.result === 'loss' ? 'bg-red-400/20 text-red-400' : 'text-muted-foreground hover:text-red-400')}
                title="Mark as Loss"
              >
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMark(r.id, null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
                title="Clear"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}