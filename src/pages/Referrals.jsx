import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Referrals() {
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      if (!me.referral_code) {
        const code = me.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8) + Math.floor(Math.random() * 100);
        await base44.auth.updateMe({ referral_code: code });
        setUser({ ...me, referral_code: code });
      } else {
        setUser(me);
      }

      const allReferrals = await base44.entities.Referral.list('-created_date', 200);
      const mine = allReferrals.filter(r => r.referrerEmail === me.email);
      setReferrals(mine);

      const countMap = {};
      allReferrals.filter(r => r.status === 'converted').forEach(r => {
        countMap[r.referrerEmail] = (countMap[r.referrerEmail] || 0) + 1;
      });
      const board = Object.entries(countMap)
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setLeaderboard(board);
      setLoading(false);
    };
    init();
  }, []);

  const referralLink = user?.referral_code ? `${window.location.origin}?ref=${user.referral_code}` : '';

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const converted = referrals.filter(r => r.status === 'converted').length;
  const rewards = referrals.filter(r => r.rewardGranted).length;

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display" style={{ fontSize: '18px', letterSpacing: '0.04em' }}>Refer and Earn</h1>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-5">
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-5 text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h2 className="font-display text-foreground mb-1" style={{ fontSize: '22px', letterSpacing: '0.04em' }}>1 Free Week Per Referral</h2>
          <p className="text-muted-foreground text-sm">Share your link. When a friend upgrades to Pro, you both win.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground truncate">
              {referralLink || 'Loading...'}
            </div>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-3 py-2 rounded-lg hover:bg-primary/90 transition-all">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Referred', value: referrals.length },
            { label: 'Converted', value: converted, color: 'text-primary' },
            { label: 'Weeks Earned', value: rewards, color: 'text-accent' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={cn('font-display font-bold', s.color || 'text-foreground')} style={{ fontSize: '22px' }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {referrals.length > 0 && (
          <div className="bg-card border border-border rounded-xl">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase">Your Referrals</p>
            </div>
            <div className="divide-y divide-border">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{r.referredEmail || 'Pending'}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      r.status === 'converted' ? 'bg-primary/20 text-primary' :
                      r.status === 'rewarded' ? 'bg-accent/20 text-accent' :
                      'bg-muted text-muted-foreground'
                    )}>{r.status}</span>
                    {r.rewardGranted && <span>✅</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {leaderboard.length > 0 && (
          <div className="bg-card border border-border rounded-xl">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase">Top Referrers 🏆</p>
            </div>
            <div className="divide-y divide-border">
              {leaderboard.map((entry, i) => (
                <div key={entry.email} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-display text-muted-foreground w-5" style={{ fontSize: '14px' }}>{i + 1}</span>
                  <span className="flex-1 text-sm text-muted-foreground truncate">
                    {entry.email === user?.email ? <strong className="text-foreground">You</strong> : entry.email}
                  </span>
                  <span className="font-display text-accent" style={{ fontSize: '14px' }}>{entry.count} refs</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}