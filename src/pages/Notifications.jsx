import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const PREFS = [
  { key: 'notify_new_pick', label: 'New parlay dropped', desc: 'Get notified when a new pick is published' },
  { key: 'notify_line_movement', label: 'Line movement alert', desc: 'Alert when odds move significantly on your picks' },
  { key: 'notify_leg_result', label: 'Leg result update', desc: 'Notified as each leg is graded' },
  { key: 'notify_parlay_result', label: 'Parlay final result', desc: 'Win/loss notification when parlay is graded' },
];

const CHANNELS = [
  { key: 'notify_email', label: 'Email notifications', desc: 'Receive alerts via email' },
  { key: 'notify_push', label: 'Push notifications', desc: 'Browser push alerts (when supported)' },
];

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setPrefs({
        notify_new_pick: u?.notify_new_pick ?? true,
        notify_line_movement: u?.notify_line_movement ?? false,
        notify_leg_result: u?.notify_leg_result ?? true,
        notify_parlay_result: u?.notify_parlay_result ?? true,
        notify_email: u?.notify_email ?? true,
        notify_push: u?.notify_push ?? false,
      });
    });
  }, []);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe(prefs);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display" style={{ fontSize: '18px', letterSpacing: '0.04em' }}>Notification Settings</h1>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-5">
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Alert Types</p>
          </div>
          {PREFS.map(p => (
            <div key={p.key} className="flex items-center justify-between px-4 py-3 gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{p.label}</p>
                <p className="text-[11px] text-muted-foreground">{p.desc}</p>
              </div>
              <Switch checked={!!prefs[p.key]} onCheckedChange={() => toggle(p.key)} />
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Channels</p>
          </div>
          {CHANNELS.map(c => (
            <div key={c.key} className="flex items-center justify-between px-4 py-3 gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">{c.desc}</p>
              </div>
              <Switch checked={!!prefs[c.key]} onCheckedChange={() => toggle(c.key)} />
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </main>
    </div>
  );
}