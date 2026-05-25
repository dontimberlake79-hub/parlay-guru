import { useEffect, useState } from 'react';
import { TrendingUp, Flame, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tickerItems = [
  { text: 'User hit 4/4 🔥', icon: Flame, color: 'text-accent' },
  { text: 'Lakers ML ✓', icon: CheckCircle, color: 'text-primary' },
  { text: 'Wemby OVER 25pts 🏀', icon: TrendingUp, color: 'text-blue-400' },
  { text: '5-leg parlay HIT! 💰', icon: Flame, color: 'text-accent' },
  { text: 'Chiefs -3.5 ✓', icon: CheckCircle, color: 'text-primary' },
  { text: 'Brunson 8+ assists 🎯', icon: TrendingUp, color: 'text-purple-400' },
  { text: '3/3 perfect ✅', icon: Flame, color: 'text-accent' },
  { text: 'Yankees ML +145 ✓', icon: CheckCircle, color: 'text-primary' },
];

export default function ScrollingTicker() {
  const [items, setItems] = useState([...tickerItems, ...tickerItems]);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => {
        const rotated = [...prev];
        const first = rotated.shift();
        rotated.push(first);
        return rotated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-b border-primary/20">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />
      <div className="flex items-center gap-8 py-2 overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                <Icon className={cn("w-3.5 h-3.5", item.color)} />
                <span className="text-foreground/90">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}