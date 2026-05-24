import { cn } from '@/lib/utils';

const sports = ['All Sports', 'NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'UFC', 'Tennis'];

export default function SportFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {sports.map((sport) => (
        <button
          key={sport}
          onClick={() => onSelect(sport)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
            selected === sport
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}