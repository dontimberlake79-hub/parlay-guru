import { useState, useRef } from 'react';
import { Share2, Twitter, Copy, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import { base44 } from '@/api/base44Client';

export default function ShareablePickCard({ parlay, tier, isOpen, onClose }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const handleShare = async () => {
    setGenerating(true);
    try {
      if (!cardRef.current) return;
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'parlay-pick.png', { type: 'image/png' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: await file.arrayBuffer() });
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Parlay Pick',
          text: `Check out this pick from The Parlay Guru! ${parlay.title}`,
          url: file_url
        });
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    setGenerating(true);
    try {
      if (!cardRef.current) return;
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        }
      });
    } catch (err) {
      console.error('Copy error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`🔥 Just generated this pick on The Parlay Guru!\n\n${parlay.title}\nTotal Odds: ${parlay.totalOdds}\n\n#ParlayGuru #SportsPicks`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const tierColors = {
    safe: 'from-primary to-primary/80',
    moderate: 'from-blue-400 to-blue-500',
    risky: 'from-accent to-accent/80',
    extreme: 'from-red-400 to-red-500',
  };

  if (!parlay) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setImageUrl(null);
      }
    }}>
      <DialogContent className="max-w-2xl bg-[#0a0a0a] border-accent/30">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display">Share Your Pick</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center text-xs text-muted-foreground">
            Preview your shareable card:
          </div>

          <div ref={cardRef} className={cn(
            "relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-2",
            tierColors[tier] || tierColors.safe
          )}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">PG</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-accent">THE PARLAY GURU</p>
                    <p className="text-[10px] text-muted-foreground">AI-Generated Picks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{parlay.sport}</p>
                  <p className="text-lg font-display font-bold text-accent">{parlay.totalOdds}</p>
                </div>
              </div>

              <h3 className="text-lg font-display font-bold text-foreground mb-3">{parlay.title}</h3>

              <div className="space-y-2 mb-4">
                {(parlay.legs || []).map((leg, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground",
                      tierColors[tier] || tierColors.safe
                    )}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-foreground/90">{leg.pick}</span>
                    <span className="font-bold text-accent">{leg.odds}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className={cn("h-full rounded-full", tierColors[tier] || tierColors.safe)} 
                      style={{ width: `${parlay.winProbability}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{parlay.winProbability}%</span>
                </div>
                <p className="text-[9px] text-muted-foreground/60">For entertainment purposes only</p>
              </div>
            </div>
          </div>

          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="Shareable pick card" className="w-full rounded-lg" />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleTwitterShare}
              className="flex-1 bg-[#1DA1F2] hover:bg-[#1a91da] text-white gap-2"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </Button>
            <Button
              onClick={handleCopyImage}
              disabled={generating}
              variant="outline"
              className="flex-1 border-accent/30 text-accent hover:bg-accent/10 gap-2"
            >
              {generating ? <><span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /> Generating...</> : <><Copy className="w-4 h-4" /> Copy Image</>}
            </Button>
            <Button
              onClick={handleShare}
              disabled={generating}
              variant="outline"
              className="flex-1 border-primary/30 text-primary hover:bg-primary/10 gap-2"
            >
              {generating ? <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Processing...</> : <><Share2 className="w-4 h-4" /> Share</>}
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}