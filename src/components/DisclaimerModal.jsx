import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DisclaimerModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('parlay_guru_disclaimer');
    if (!hasSeenDisclaimer) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('parlay_guru_disclaimer', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-accent" />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground">Important Notice</h2>
        </div>
        
        <div className="space-y-3 text-sm text-muted-foreground mb-6">
          <p>
            <strong className="text-foreground">Parlay Guru</strong> provides AI-generated pick suggestions for entertainment purposes only.
          </p>
          <p>
            We are <strong className="text-foreground">NOT a sportsbook</strong> and do not facilitate gambling or accept wagers.
          </p>
          <p>
            All picks are AI-generated predictions based on statistical analysis. We do not guarantee results.
          </p>
          <p className="text-accent font-semibold">
            By continuing, you agree to use this app responsibly and for entertainment only.
          </p>
        </div>

        <Button onClick={handleAccept} className="w-full h-11 font-semibold">
          I Understand
        </Button>
      </div>
    </div>
  );
}