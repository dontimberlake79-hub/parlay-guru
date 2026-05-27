import { Shield, TrendingUp, Flame, Zap, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiers = [
  { id: 'safe',     label: 'Safe Play',   odds: 'Max +250',     icon: Shield,    color: 'text-primary',    bg: 'bg-primary/8',    border: 'border-primary/25',    desc: '60–85% hit rate' },
  { id: 'moderate', label: 'Moderate',    odds: 'Max +550',     icon: TrendingUp,color: 'text-blue-400',   bg: 'bg-blue-400/8',   border: 'border-blue-400/25',   desc: '30–55% hit rate' },
  { id: 'risky',    label: 'High Risk',   odds: 'Max +1200',    icon: Flame,     color: 'text-amber-400',  bg: 'bg-amber-400/8',  border: 'border-amber-400/25',  desc: '8–25% hit rate'  },
  { id: 'extreme',  label: 'Extreme',     odds: 'Max +2500',    icon: Zap,       color: 'text-red-400',    bg: 'bg-red-400/8',    border: 'border-red-400/25',    desc: '2–8% hit rate'   },
  { id: 'chasing',  label: 'Lottery',     odds: '+2500–+12000', icon: Rocket,    color: 'text-purple-400', bg: 'bg-purple-400/8', border: 'border-purple-400/25', desc: '< 2% hit rate'   },
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
              "relative p-3.5 rounded-xl border transition-all duration-200 text-left",
              active
                ? `${tier.bg} ${tier.border}`
                : "border-border bg-card/60 hover:border-border/80 hover:bg-card"
            )}
            style={active ? { backdropFilter: 'blur(8px)' } : {}}
          >
            <Icon className={cn("w-4 h-4 mb-2", active ? tier.color : "text-muted-foreground/70")} />
            <p className={cn("font-semibold text-xs tracking-wide", active ? "text-foreground" : "text-muted-foreground")}>{tier.label}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{tier.odds}</p>
            <p className={cn("text-[10px] mt-1 font-medium", active ? tier.color : "text-muted-foreground/50")}>{tier.desc}</p>
            {active && <div className={cn("absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full", tier.color.replace('text-', 'bg-'))} />}
          </button>
        );
      })}
    </div>
  );
}