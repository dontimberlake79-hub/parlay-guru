import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UFC', 'Tennis', 'Golf', 'Other'];
const STATUSES = ['pending', 'won', 'lost', 'push'];
const TIERS = ['free', 'pro', 'vip'];
const BET_TYPES = ['spread', 'total', 'moneyline', 'prop'];
const PARLAY_TYPES = [
  { value: 'quick_hit', label: 'Quick Hit (2 legs)' },
  { value: 'main_slate', label: 'Main Slate (3 legs)' },
  { value: 'power_parlay', label: 'Power Parlay (4-5 legs)' },
];

const emptyLeg = () => ({ game: '', pick: '', betType: 'moneyline', odds: '', result: 'pending', reasoning: '' });
const emptyParlay = () => ({ title: '', sport: 'NBA', date: new Date().toISOString().split('T')[0], scheduledAt: '', parlayType: 'main_slate', totalOdds: '', status: 'pending', tier: 'pro', published: false, legs: [emptyLeg()], notes: '' });

function LegEditor({ leg, onChange, onRemove }) {
  return (
    <div className="bg-background/50 rounded-xl border border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-muted-foreground uppercase">Leg</p>
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 transition-all"><X className="w-4 h-4" /></button>
      </div>
      <input value={leg.game || ''} onChange={e => onChange({ ...leg, game: e.target.value })}
        placeholder="Game (e.g. Lakers vs Celtics)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      <input value={leg.pick || ''} onChange={e => onChange({ ...leg, pick: e.target.value })}
        placeholder="Pick (e.g. Lakers -3.5)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      <div className="flex gap-2">
        <select value={leg.betType || 'moneyline'} onChange={e => onChange({ ...leg, betType: e.target.value })}
          className="flex-1 bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {BET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={leg.odds || ''} onChange={e => onChange({ ...leg, odds: e.target.value })}
          placeholder="Odds (e.g. -110)" className="w-28 bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        <select value={leg.result || 'pending'} onChange={e => onChange({ ...leg, result: e.target.value })}
          className="w-28 bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <textarea value={leg.reasoning || ''} onChange={e => onChange({ ...leg, reasoning: e.target.value })}
        placeholder="Analysis / reasoning for this leg..." rows={2}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
    </div>
  );
}

function ParlayEditor({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyParlay());
  const [saving, setSaving] = useState(false);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setLeg = (i, leg) => setForm(f => ({ ...f, legs: f.legs.map((l, idx) => idx === i ? leg : l) }));
  const addLeg = () => setForm(f => ({ ...f, legs: [...f.legs, emptyLeg()] }));
  const removeLeg = (i) => setForm(f => ({ ...f, legs: f.legs.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    const data = { ...form, publishedAt: form.published ? new Date().toISOString() : null };
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <input value={form.title} onChange={e => setField('title', e.target.value)}
        placeholder="Parlay title..." className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.sport} onChange={e => setField('sport', e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={form.date} onChange={e => setField('date', e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        <input value={form.totalOdds} onChange={e => setField('totalOdds', e.target.value)}
          placeholder="Total odds (e.g. +650)" className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        <select value={form.status} onChange={e => setField('status', e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.tier} onChange={e => setField('tier', e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.parlayType || 'main_slate'} onChange={e => setField('parlayType', e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {PARLAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input type="datetime-local" value={form.scheduledAt || ''} onChange={e => setField('scheduledAt', e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        <label className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={!!form.published} onChange={e => setField('published', e.target.checked)} />
          <span className="text-sm text-foreground">Published</span>
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-muted-foreground uppercase">Legs</p>
          <button onClick={addLeg} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-all">
            <Plus className="w-3 h-3" /> Add Leg
          </button>
        </div>
        <div className="space-y-2">
          {form.legs.map((leg, i) => (
            <LegEditor key={i} leg={leg} onChange={l => setLeg(i, l)} onRemove={() => removeLeg(i)} />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Parlay'}
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [parlays, setParlays] = useState([]);
  const [cappers, setCappers] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('parlays');
  const [editing, setEditing] = useState(null); // null | 'new' | parlay object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.role !== 'admin') return;
      await loadAll();
    };
    init();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [ps, cs, us] = await Promise.all([
      base44.entities.Parlay.list('-date', 100),
      base44.entities.Capper.list(),
      base44.entities.User.list(),
    ]);
    setParlays(ps);
    setCappers(cs);
    setUsers(us);
    setLoading(false);
  };

  const saveParlay = async (data) => {
    if (data.id) {
      await base44.entities.Parlay.update(data.id, data);
    } else {
      await base44.entities.Parlay.create(data);
    }
    setEditing(null);
    await loadAll();
  };

  const deleteParlay = async (id) => {
    if (!confirm('Delete this parlay?')) return;
    await base44.entities.Parlay.delete(id);
    await loadAll();
  };

  const togglePublish = async (p) => {
    await base44.entities.Parlay.update(p.id, { published: !p.published, publishedAt: !p.published ? new Date().toISOString() : null });
    await loadAll();
  };

  const gradeParlay = async (p, status) => {
    await base44.entities.Parlay.update(p.id, { status });
    await loadAll();
  };

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (user.role !== 'admin') return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Admin access required.</p></div>;

  const wins = parlays.filter(p => p.status === 'won').length;
  const losses = parlays.filter(p => p.status === 'lost').length;
  const published = parlays.filter(p => p.published).length;
  const proUsers = users.filter(u => u.subscription_tier === 'pro' || u.subscription_tier === 'vip').length;
  const typeBreakdown = PARLAY_TYPES.map(({ value, label }) => {
    const group = parlays.filter(p => (p.parlayType || 'main_slate') === value);
    const w = group.filter(p => p.status === 'won').length;
    const l = group.filter(p => p.status === 'lost').length;
    return { label: label.split(' (')[0], value, total: group.length, wins: w, losses: l, rate: group.length ? Math.round(w / group.length * 100) : 0 };
  });

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-background/90">
        <div className="max-w-[430px] mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display flex-1" style={{ fontSize: '18px', letterSpacing: '0.04em' }}>Admin Panel</h1>
          <span className="text-[10px] bg-red-400/20 text-red-400 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-3 py-4 space-y-4">
        {/* Revenue stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Published', value: published, color: 'text-foreground' },
            { label: 'Record', value: `${wins}-${losses}`, color: 'text-primary' },
            { label: 'Pro Users', value: proUsers, color: 'text-accent' },
            { label: 'Total Users', value: users.length, color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-2 text-center">
              <p className={cn('font-display font-bold', s.color)} style={{ fontSize: '16px' }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Type breakdown */}
        <div className="grid grid-cols-3 gap-2">
          {typeBreakdown.map(t => (
            <div key={t.value} className="bg-card border border-border rounded-lg p-2 text-center">
              <p className="font-bold text-foreground" style={{ fontSize: '13px' }}>{t.wins}-{t.losses}</p>
              <p className="text-[10px] text-primary font-bold">{t.rate}% W</p>
              <p className="text-[10px] text-muted-foreground truncate">{t.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {['parlays', 'users', 'cappers'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all',
                tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {t}
            </button>
          ))}
        </div>

        {/* Parlays tab */}
        {tab === 'parlays' && (
          <div className="space-y-3">
            {editing === 'new' ? (
              <ParlayEditor onSave={saveParlay} onCancel={() => setEditing(null)} />
            ) : editing ? (
              <ParlayEditor initial={editing} onSave={saveParlay} onCancel={() => setEditing(null)} />
            ) : (
              <button onClick={() => setEditing('new')}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all">
                <Plus className="w-4 h-4" /> New Parlay
              </button>
            )}

            {!editing && (
              <div className="space-y-2">
                {loading ? (
                  <div className="h-20 bg-card rounded-xl animate-pulse border border-border" />
                ) : parlays.map(p => (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.sport}</span>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            p.status === 'won' ? 'bg-primary/20 text-primary' :
                            p.status === 'lost' ? 'bg-red-400/20 text-red-400' :
                            'bg-muted text-muted-foreground'
                          )}>{p.status}</span>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            p.published ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                          )}>{p.published ? 'LIVE' : 'DRAFT'}</span>
                        </div>
                        <p className="font-semibold text-foreground truncate" style={{ fontSize: '13px' }}>{p.title}</p>
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{new Date(p.date).toLocaleDateString()} • {(p.legs || []).length} legs • {p.totalOdds}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={() => setEditing(p)} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-secondary transition-all">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => togglePublish(p)} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-secondary transition-all">
                        {p.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {p.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <select value={p.status} onChange={e => gradeParlay(p, e.target.value)}
                        className="text-[11px] font-semibold text-muted-foreground bg-secondary border-0 rounded-lg px-2 py-1 focus:outline-none cursor-pointer hover:text-foreground transition-all">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => deleteParlay(p.id)} className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-400/10 transition-all ml-auto">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-muted-foreground uppercase">{users.length} Total Users</p>
            </div>
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                  u.subscription_tier === 'vip' ? 'bg-accent/20 text-accent' :
                  u.subscription_tier === 'pro' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                )}>{u.subscription_tier || 'free'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cappers tab */}
        {tab === 'cappers' && (
          <div className="space-y-3">
            {cappers.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">🎯</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground" style={{ fontSize: '14px' }}>{c.name}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{c.wins}W - {c.losses}L • ROI: {c.roi}%</p>
                </div>
              </div>
            ))}
            {cappers.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No cappers yet. Add cappers via the database.</p>}
          </div>
        )}
      </main>
    </div>
  );
}