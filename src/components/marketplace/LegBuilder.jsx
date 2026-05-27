import { Trash2 } from 'lucide-react';

const BET_TYPES = ['Moneyline', 'Spread', 'Over/Under', 'Player Prop', 'Team Total', 'First Half', 'Alt Spread', 'Alt Total'];

export default function LegBuilder({ leg, index, onChange, onRemove }) {
  const update = (field, value) => onChange({ ...leg, [field]: value });

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Leg {index + 1}</span>
        <button onClick={onRemove} className="text-[#444] hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Game / Matchup</label>
          <input
            value={leg.game || ''}
            onChange={e => update('game', e.target.value)}
            placeholder="e.g. Lakers vs Warriors"
            className="w-full rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] outline-none"
            style={{ background: '#111', border: '1px solid #2A2A2A' }}
          />
        </div>
        <div>
          <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Your Pick</label>
          <input
            value={leg.pick || ''}
            onChange={e => update('pick', e.target.value)}
            placeholder="e.g. Lakers -4.5"
            className="w-full rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] outline-none"
            style={{ background: '#111', border: '1px solid #2A2A2A' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Bet Type</label>
          <select
            value={leg.betType || ''}
            onChange={e => update('betType', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
            style={{ background: '#111', border: '1px solid #2A2A2A' }}
          >
            <option value="">Select...</option>
            {BET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Odds</label>
          <input
            value={leg.odds || ''}
            onChange={e => update('odds', e.target.value)}
            placeholder="e.g. -110"
            className="w-full rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] outline-none"
            style={{ background: '#111', border: '1px solid #2A2A2A' }}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-[#555] uppercase tracking-widest block mb-1">Your Reasoning</label>
        <textarea
          value={leg.reasoning || ''}
          onChange={e => update('reasoning', e.target.value)}
          placeholder="Why do you like this pick? (shown to buyers)"
          rows={2}
          className="w-full rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] outline-none resize-none"
          style={{ background: '#111', border: '1px solid #2A2A2A' }}
        />
      </div>
    </div>
  );
}