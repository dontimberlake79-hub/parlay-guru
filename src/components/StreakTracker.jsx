import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const LS_KEY = 'app_streak';

export default function StreakTracker() {
  const [streak, setStreak] = useState(0);
  const [justIncreased, setJustIncreased] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(LS_KEY);
    let data = { lastVisit: null, streak: 0 };
    
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {}
    }

    const lastVisit = data.lastVisit;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastVisit) {
      setStreak(1);
      localStorage.setItem(LS_KEY, JSON.stringify({ lastVisit: today, streak: 1 }));
      setJustIncreased(true);
    } else if (lastVisit === today) {
      setStreak(data.streak);
    } else if (new Date(lastVisit) >= yesterday) {
      const newStreak = data.streak + 1;
      setStreak(newStreak);
      localStorage.setItem(LS_KEY, JSON.stringify({ lastVisit: today, streak: newStreak }));
      setJustIncreased(true);
    } else {
      setStreak(1);
      localStorage.setItem(LS_KEY, JSON.stringify({ lastVisit: today, streak: 1 }));
      setJustIncreased(true);
    }

    const timer = setTimeout(() => setJustIncreased(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 transition-all",
      justIncreased && "scale-110 animate-pulse"
    )}>
      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
      <span className="font-display text-orange-500" style={{ fontSize: '16px', letterSpacing: '0.05em' }}>{streak} day streak</span>
    </div>
  );
}