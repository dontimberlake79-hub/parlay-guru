import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Star, Zap, Crown } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: '🎯',
    color: 'border-border',
    badge: null,
    features: [
      'Leg 1 preview per parlay',
      'No analysis or reasoning',
      '1-hour delay on new picks',
      'Win/Loss record visible',
      'Limited to public picks',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19.99',
    annual: '$149',
    period: '/month',
    icon: '🏆',
    color: 'border-primary',
    badge: 'MOST POPULAR',
    features: [
      'Full parlay slips — all legs',
      'Complete reasoning & analysis',
      'Instant access when picks drop',
      'All sports covered',
      'Picks history archive',
      'Record & stats dashboard',
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '$39.99',
    period: '/month',
    icon: '👑',
    color: 'border-accent',
    badge: 'BEST VALUE',
    features: [
      'Everything in Pro',
      '30-min early access to picks',
      'VIP Discord community',
      'Direct capper Q&A access',
      'Line movement alerts',
      'Priority support',
    ],
    cta: 'Go VIP',
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display" style={{ fontSize: '18px', letterSpacing: '0.04em' }}>Choose Your Plan</h1>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-6 space-y-5">
        <div className="text-center">
          <h2 className="font-display text-foreground" style={{ fontSize: '26px', letterSpacing: '0.04em', color: '#FFD700' }}>Upgrade Your Edge</h2>
          <p className="text-sm text-muted-foreground mt-1">Expert daily parlays. Full analysis. Real results.</p>
        </div>

        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-card border-2 ${plan.color} rounded-2xl p-4 relative overflow-hidden`}>
              {plan.badge && (
                <div className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-xl ${plan.id === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  {plan.badge}
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{plan.icon}</span>
                    <h3 className="font-display text-foreground" style={{ fontSize: '20px', letterSpacing: '0.04em' }}>{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-foreground" style={{ fontSize: '28px' }}>{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  {plan.annual && (
                    <p className="text-[11px] text-primary font-semibold mt-0.5">or {plan.annual}/year — save 38%</p>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground" style={{ fontSize: '13px' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.disabled}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.disabled
                    ? 'bg-secondary text-muted-foreground cursor-default'
                    : plan.id === 'pro'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : plan.id === 'vip'
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                    : ''
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">⚠️ The Parlay Guru is for <strong className="text-foreground">entertainment purposes only</strong>. We do not accept bets or guarantee results. Please gamble responsibly.</p>
        </div>

        <div className="text-center pb-4">
          <Link to="/referrals" className="text-sm text-primary hover:text-primary/80 transition-all">🎁 Refer a friend — get 1 free week</Link>
        </div>
      </main>
    </div>
  );
}