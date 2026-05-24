import { Shield, TrendingUp, Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiers = [
  { id: 'safe', label: 'Safe Play', legs: '1–3 legs', icon: Shield, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', desc: '65–85% win rate' },
  { id: 'moderate', label: 'Moderate', legs: '4–6 legs', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', desc: '35–60% win rate' },
  { id: 'risky', label: 'High Risk', legs: '7–10 legs', icon: Flame, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', desc: '10–30% win rate' },
  { id: 'extreme', label: 'Extreme', legs: '11–16 legs', icon: Zap, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', desc: '1–8% win rate' },
];

export default function RiskSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiers.map((tier) => {
        const Icon = tier.icon;
        const active = selected === tier.id;
        return (
          <button
            key={tier.id}
            onClick={() => onSelect(tier.id)}
            className={cn(
              "relative p-4 rounded-lg border-2 transition-all duration-200 text-left group",
              active ? `${tier.bg} ${tier.border}` : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-2", active ? tier.color : "text-muted-foreground")} />
            <p className={cn("font-display font-bold text-sm", active ? "text-foreground" : "text-muted-foreground")}>{tier.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{tier.legs}</p>
            <p className={cn("text-[11px] mt-1 font-medium", active ? tier.color : "text-muted-foreground/60")}>{tier.desc}</p>
            {active && <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full", tier.color.replace('text-', 'bg-'))} />}
          </button>
        );
      })}
    </div>
  );
}