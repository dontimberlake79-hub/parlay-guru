import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'WNBA', 'CFL', 'MLS', 'EPL', 'Champions League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'UFC', 'Boxing', 'Tennis', 'Golf', 'F1', 'Rugby', 'Cricket', 'Aussie Rules'];

export default function SportFilter({ selected, onToggle }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {sports.map((sport) => {
        const active = selected.includes(sport);
        return (
          <button
            key={sport}
            onClick={() => onToggle(sport)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {active && <Check className="w-3 h-3" />}
            {sport}
          </button>
        );
      })}
    </div>
  );
}