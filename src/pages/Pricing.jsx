import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    accentColor: '#444',
    glowColor: 'transparent',
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
    accentColor: '#00C853',
    glowColor: '#00C85340',
    badge: 'MOST POPULAR',
    features: [
      'Full parlay slips — all legs',
      'Complete reasoning & analysis',
      'Instant access when picks drop',
      'All sports covered',
      'Picks history archive',
      'Record & stats dashboard',
    ],
    cta: 'Start Pro — $19.99/mo',
    highlighted: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '$39.99',
    period: '/month',
    accentColor: '#FFD600',
    glowColor: '#FFD60040',
    badge: 'BEST VALUE',
    features: [
      'Everything in Pro',
      '30-min early access to picks',
      'VIP Discord community',
      'Direct capper Q&A access',
      'Line movement alerts',
      'Priority support',
    ],
    cta: 'Go VIP — $39.99/mo',
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen font-inter" style={{ background: '#0D0D0D' }}>
      <header className="sticky top-0 z-50 border-b" style={{ background: '#111', borderColor: '#222' }}>
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg text-[#666] hover:text-white transition-all" style={{ background: '#1A1A1A' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display text-white tracking-wider" style={{ fontSize: '18px' }}>Choose Your Plan</h1>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-6 space-y-4">
        <div className="text-center">
          <h2 className="font-display text-white" style={{ fontSize: '28px', letterSpacing: '0.04em' }}>
            <span style={{ color: '#00C853' }}>UPGRADE</span> YOUR EDGE
          </h2>
          <p className="text-[#555] text-sm mt-1">Expert daily parlays. Full analysis. Real results.</p>
        </div>

        <div className="space-y-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="rounded-xl p-4 relative overflow-hidden"
              style={{
                background: '#141414',
                border: `1px solid ${plan.accentColor}`,
                boxShadow: plan.highlighted ? `0 0 24px ${plan.glowColor}` : 'none',
              }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: plan.accentColor }} />

              {plan.badge && (
                <div className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: plan.accentColor, color: '#000' }}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-4">
                <p className="font-bold text-[#666] text-xs uppercase tracking-widest mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-bold text-white" style={{ fontSize: '32px', letterSpacing: '-0.02em' }}>{plan.price}</span>
                  <span className="text-[#555] text-sm">{plan.period}</span>
                </div>
                {plan.annual && (
                  <p className="text-xs font-semibold mt-0.5" style={{ color: plan.accentColor }}>or {plan.annual}/year — save 38%</p>
                )}
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: plan.accentColor }} />
                    <span className="text-[#888]" style={{ fontSize: '13px' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.disabled}
                className="w-full py-3 rounded-full font-bold text-sm transition-all"
                style={plan.disabled
                  ? { background: '#1E1E1E', color: '#444', cursor: 'default' }
                  : { background: plan.accentColor, color: '#000', fontWeight: 700 }
                }
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-3 text-center" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
          <p className="text-xs text-[#555]">⚠️ The Parlay Guru is for <strong className="text-[#888]">entertainment purposes only</strong>. We do not accept bets or guarantee results.</p>
        </div>

        <div className="text-center pb-4">
          <Link to="/referrals" className="text-sm font-semibold transition-all" style={{ color: '#00C853' }}>🎁 Refer a friend — get 1 free week</Link>
        </div>
      </main>
    </div>
  );
}