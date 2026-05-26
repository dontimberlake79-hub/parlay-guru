import { useState, useRef } from 'react';
import { Share2, Twitter, Copy, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PARLAY_TYPE_LABEL = {
  quick_hit: 'Quick Hit ⚡',
  main_slate: 'Main Slate 🎯',
  power_parlay: 'Power Parlay 💥',
};

export default function ShareablePickCard({ parlay, tier, isOpen, onClose }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);

  if (!parlay) return null;

  const legs = parlay.legs || [];
  const typeLabel = PARLAY_TYPE_LABEL[parlay.parlayType] || '';

  const getShareText = () => {
    const legLines = legs.map((leg, i) => `  ${i + 1}. ${leg.pick} (${leg.odds})`).join('\n');
    return `🔥 ${parlay.title}\n${typeLabel ? typeLabel + ' | ' : ''}${parlay.sport} | ${parlay.totalOdds}\n\nLegs:\n${legLines}\n\nWin Probability: ${parlay.winProbability}%\n\n#ParlayGuru #SportsPicks\n⚠️ Entertainment only`;
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sportColor = parlay.sport === 'NBA' ? '#C9A84C'
    : parlay.sport === 'NFL' ? '#013369'
    : parlay.sport === 'MLB' ? '#002D72'
    : parlay.sport === 'NHL' ? '#00539B'
    : '#00C853';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm bg-[#0a0a0a] border-[#222]">
        <DialogHeader>
          <DialogTitle className="text-white font-display tracking-widest">Share Your Pick</DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <div ref={cardRef} className="rounded-xl overflow-hidden border" style={{ background: '#111', borderColor: '#222' }}>
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: '#1a1a1a', borderLeft: `4px solid ${sportColor}` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold tracking-widest" style={{ color: '#555' }}>THE PARLAY GURU</span>
              <span className="text-[10px] font-bold" style={{ color: sportColor }}>{parlay.sport}</span>
            </div>
            <p className="font-semibold text-white text-sm leading-tight">{parlay.title}</p>
            {typeLabel && <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{typeLabel}</p>}
          </div>

          {/* Legs */}
          <div className="px-4 py-3 space-y-2">
            {legs.map((leg, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5" style={{ background: sportColor, color: '#000' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium leading-tight">{leg.pick}</p>
                  {leg.matchup && <p className="text-[10px]" style={{ color: '#555' }}>{leg.matchup}</p>}
                </div>
                <span className="text-xs font-bold font-mono shrink-0" style={{ color: '#00C853' }}>{leg.odds}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px]" style={{ color: '#555' }}>Total Odds</p>
              <p className="font-mono font-bold" style={{ color: '#00C853', fontSize: '18px' }}>{parlay.totalOdds}</p>
            </div>
            {parlay.winProbability !== undefined && (
              <div className="text-right">
                <p className="text-[10px]" style={{ color: '#555' }}>Hit Rate</p>
                <p className="text-sm font-bold text-white">{parlay.winProbability}%</p>
              </div>
            )}
          </div>
          <div className="px-4 pb-3">
            <p className="text-[9px]" style={{ color: '#333' }}>⚠️ Entertainment only — not financial advice</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleTwitterShare} className="flex-1 gap-1.5 text-xs" style={{ background: '#1DA1F2', color: '#fff' }}>
            <Twitter className="w-3.5 h-3.5" /> Twitter
          </Button>
          <Button onClick={handleCopyText} variant="outline" className="flex-1 gap-1.5 text-xs border-[#333] text-white hover:bg-[#1a1a1a]">
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy Text'}
          </Button>
        </div>

        <Button onClick={onClose} variant="ghost" className="w-full text-[#555] text-xs">
          <X className="w-3.5 h-3.5 mr-1.5" /> Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}