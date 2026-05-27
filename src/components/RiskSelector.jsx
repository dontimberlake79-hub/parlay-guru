import { Shield, TrendingUp, Flame, Zap, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiers = [
  { id: 'safe',     label: 'Safe',        odds: '+100–+250',    icon: Shield,     color: '#16A34A',  desc: '60–85% hit rate' },
  { id: 'moderate', label: 'Moderate',    odds: '+250–+550',    icon: TrendingUp, color: '#3B82F6',  desc: '30–55% hit rate' },
  { id: 'risky',    label: 'High Risk',   odds: '+550–+1200',   icon: Flame,      color: '#F59E0B',  desc: '8–25% hit rate'  },
  { id: 'extreme',  label: 'Extreme',     odds: '+1200–+2500',  icon: Zap,        color: '#EF4444',  desc: '2–8% hit rate'   },
  { id: 'chasing',  label: 'Lottery',     odds: '+2500+',       icon: Rocket,     color: '#8B5CF6',  desc: '< 2% hit rate'   },
];

export default function RiskSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
      {tiers.map((tier) => {
        const Icon = tier.icon;
        const active = selected === tier.id;
        return (
          <button
            key={tier.id}
            onClick={() => onSelect(tier.id)}
            className="relative p-3 rounded-lg border transition-all duration-150 text-left"
            style={{
              background: active ? `${tier.color}12` : '#161B22',
              border: `1px solid ${active ? `${tier.color}40` : '#1E2533'}`,
            }}
          >
            <Icon className="w-3.5 h-3.5 mb-2" style={{ color: active ? tier.color : '#4B5563' }} />
            <p className="font-semibold text-xs" style={{ color: active ? '#E5E7EB' : '#9CA3AF' }}>{tier.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{tier.odds}</p>
            <p className="text-[10px] mt-1" style={{ color: active ? tier.color : '#4B5563' }}>{tier.desc}</p>
          </button>
        );
      })}
    </div>
  );
}