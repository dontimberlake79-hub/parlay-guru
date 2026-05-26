import { Shield, TrendingUp, Flame, Zap, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiers = [
  { id: 'safe',     label: 'Safe Play',        odds: 'Max +250',     icon: Shield,    color: 'text-primary',  bg: 'bg-primary/10',  border: 'border-primary/30',  desc: '60–85% win rate' },
  { id: 'moderate', label: 'Moderate',          odds: 'Max +550',     icon: TrendingUp,color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', desc: '30–55% win rate' },
  { id: 'risky',    label: 'High Risk',          odds: 'Max +1200',    icon: Flame,     color: 'text-accent',   bg: 'bg-accent/10',   border: 'border-accent/30',   desc: '8–25% win rate'  },
  { id: 'extreme',  label: 'Extreme',            odds: 'Max +2500',    icon: Zap,       color: 'text-red-400',  bg: 'bg-red-400/10',  border: 'border-red-400/30',  desc: '2–8% win rate'   },

  { id: 'chasing',  label: 'Chasing Chicken 🐔', odds: '+2500–+12000', icon: Rocket,    color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', desc: '0–2% win rate' },
];

export default function RiskSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
            <p className="text-xs text-muted-foreground mt-0.5">{tier.odds}</p>
            <p className={cn("text-[11px] mt-1 font-medium", active ? tier.color : "text-muted-foreground/60")}>{tier.desc}</p>
            {active && <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full", tier.color.replace('text-', 'bg-'))} />}
          </button>
        );
      })}
    </div>
  );
}