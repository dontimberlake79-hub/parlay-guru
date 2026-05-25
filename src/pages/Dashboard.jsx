import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, TrendingUp, Target, Flame, Heart, ChevronDown, ChevronUp, BarChart3, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

function StatCard({ label, value, sub, color = 'text-foreground', icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={cn("w-4 h-4", color)} />}
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn("text-3xl font-display font-bold", color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ParlayRow({ parlay, rank, currentUserEmail, onLike }) {
  const [expanded, setExpanded] = useState(false);
  const liked = parlay.likes?.includes(currentUserEmail);
  const likeCount = parlay.likes?.length || 0;
  const resultColor = parlay.result === 'win' ? 'text-primary' : parlay.result === 'loss' ? 'text-red-400' : 'text-muted-foreground';

  const toggleLike = async (e) => {
    e.stopPropagation();
    const currentLikes = parlay.likes || [];
    const newLikes = liked ? currentLikes.filter(x => x !== currentUserEmail) : [...currentLikes, currentUserEmail];
    await base44.entities.ParlayRecord.update(parlay.id, { likes: newLikes });
    onLike(parlay.id, newLikes);
  };

  return (
    <div className={cn("bg-card border rounded-lg overflow-hidden transition-all", rank <= 3 ? "border-accent/40" : "border-border")}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-3 text-left">
        <div className="flex items-center gap-3">
          <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold shrink-0",
            rank === 1 ? "bg-accent text-accent-foreground" :
            rank === 2 ? "bg-muted-foreground/30 text-foreground" :
            rank === 3 ? "bg-amber-700/40 text-amber-400" : "bg-secondary text-muted-foreground"
          )}>
            {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{parlay.title}</p>
            <p className="text-[11px] text-muted-foreground">{parlay.sport} · {parlay.totalOdds} · {parlay.legs?.length || 0} legs</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("text-[11px] font-bold", resultColor)}>
              {parlay.result === 'win' ? '✓ WIN' : parlay.result === 'loss' ? '✗ LOSS' : '⏳'}
            </span>
            <button onClick={toggleLike} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all",
              liked ? "bg-red-400/15 text-red-400 border-red-400/30" : "text-muted-foreground border-border hover:text-red-400"
            )}>
              <Heart className={cn("w-3 h-3", liked && "fill-current")} />{likeCount}
            </button>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>
      </button>
      {expanded && parlay.legs?.length > 0 && (
        <div className="px-4 pb-3 border-t border-border pt-2.5 space-y-1.5">
          {parlay.legs.map((leg, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
              <span className="flex-1 text-foreground">{leg.pick}</span>
              <span className="text-accent font-bold">{leg.odds}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('top');
  const [generating, setGenerating] = useState(false);
  const [generatedParlays, setGeneratedParlays] = useState([]);
  const [expandedParlay, setExpandedParlay] = useState(null);

  const generateFromCache = async () => {
    setGenerating(true);
    const cached = sessionStorage.getItem('props_cache');
    if (!cached) {
      alert('No cached odds found. Please wait for the app to load or refresh the page.');
      setGenerating(false);
      return;
    }
    const games = JSON.parse(cached);
    const oddsContext = games.length > 0
      ? '\n\nHere are REAL live odds with player props. Use ONLY these:\n' + JSON.stringify(games, null, 2)
      : '';
    const prompt = `You are a sports parlay analyst specializing in player props. Generate exactly 10 unique parlay picks with EXCITING, SPECIFIC legs like "Wemby 20+ points" or "Jalen Brunson 7+ assists".\n\nMANDATORY:\n1. Use real games and players from the data provided.\n2. EACH PARLAY: 2 player props (points/assists/rebounds/threes) + 1 moneyline + 1 spread/alternate. NEVER all overs/unders.\n3. For player props, use format: "Player Name — Stat — Over/Under Line" (e.g. "Victor Wembanyama — Points — Over 19.5").\n4. Filter out ANY prop without a real player name — skip generic "Over/Under" with no player.\n5. Return American odds format.\n6. Display legs clearly: Player Name, Stat, Line, Odds (e.g. "Jalen Brunson — Assists — Over 6.5 — (-115)").${oddsContext}\n\nReturn JSON matching schema exactly.`;
    const schema = { type: 'object', properties: { parlays: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, sport: { type: 'string' }, totalOdds: { type: 'string' }, legs: { type: 'array', items: { type: 'object', properties: { pick: { type: 'string' }, matchup: { type: 'string' }, odds: { type: 'string' } } } } } } } } };
    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema, model: 'gemini_3_flash' });
    setGeneratedParlays(res.parlays || []);
    setGenerating(false);
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    base44.entities.ParlayRecord.list('-created_date', 200).then(r => {
      setRecords(r || []);
      setLoading(false);
    });
  }, []);

  const handleLike = (id, newLikes) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, likes: newLikes } : r));
  };

  const wins = records.filter(r => r.result === 'win').length;
  const losses = records.filter(r => r.result === 'loss').length;
  const pending = records.filter(r => !r.result).length;
  const hitRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
  const totalLikes = records.reduce((sum, r) => sum + (r.likes?.length || 0), 0);

  const sportMap = {};
  records.forEach(r => {
    if (!r.sport) return;
    if (!sportMap[r.sport]) sportMap[r.sport] = { wins: 0, losses: 0, total: 0 };
    sportMap[r.sport].total++;
    if (r.result === 'win') sportMap[r.sport].wins++;
    if (r.result === 'loss') sportMap[r.sport].losses++;
  });
  const sportData = Object.entries(sportMap).map(([sport, d]) => ({ sport, ...d }));

  const pieData = [
    { name: 'Wins', value: wins, color: 'hsl(142 72% 50%)' },
    { name: 'Losses', value: losses, color: 'hsl(0 84% 60%)' },
    { name: 'Pending', value: pending, color: 'hsl(215 14% 50%)' },
  ].filter(d => d.value > 0);

  const byLikes = [...records].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  const byWins = records.filter(r => r.result === 'win').sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  const byRecent = [...records].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const displayed = view === 'top' ? byLikes : view === 'wins' ? byWins : byRecent;

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground leading-tight" style={{fontFamily:"'Dancing Script',cursive"}}>Performance Dashboard</h1>
              <p className="text-[11px] text-muted-foreground">Community stats and top picks</p>
            </div>
          </div>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary transition-all">Back</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Instant Generator</h2>
            <p className="text-xs text-muted-foreground">Uses cached live odds — no new API calls</p>
          </div>
          <button
            onClick={generateFromCache}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          >
            {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate</>}
          </button>
        </div>

        {generatedParlays.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Generated Parlays</h3>
            {generatedParlays.map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
                <button onClick={() => setExpandedParlay(expandedParlay === i ? null : i)} className="w-full p-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground">{p.sport} · {p.totalOdds} · {p.legs?.length || 0} legs</p>
                    </div>
                    <span className="text-accent font-bold text-sm">{p.totalOdds}</span>
                    {expandedParlay === i ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>
                {expandedParlay === i && p.legs?.length > 0 && (
                  <div className="px-4 pb-3 border-t border-border pt-2.5 space-y-1.5">
                    {p.legs.map((leg, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{j+1}</span>
                        <span className="flex-1 text-foreground">{leg.pick}</span>
                        <span className="text-accent font-bold">{leg.odds}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Picks" value={records.length} icon={Target} color="text-blue-400" />
              <StatCard label="Win Rate" value={`${hitRate}%`} icon={TrendingUp} color="text-primary" sub={`${wins}W / ${losses}L`} />
              <StatCard label="Wins" value={wins} icon={Flame} color="text-accent" sub="confirmed wins" />
              <StatCard label="Total Likes" value={totalLikes} icon={Heart} color="text-red-400" />
            </div>

            {(wins > 0 || losses > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Win / Loss Breakdown</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 14% 16%)', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {sportData.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Wins by Sport</h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={sportData} barSize={20}>
                        <XAxis dataKey="sport" tick={{ fontSize: 10, fill: 'hsl(215 14% 50%)' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 14% 16%)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="wins" fill="hsl(142 72% 50%)" radius={[4,4,0,0]} name="Wins" />
                        <Bar dataKey="losses" fill="hsl(0 84% 60%)" radius={[4,4,0,0]} name="Losses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Community Parlays</h2>
                <div className="flex gap-1">
                  {[['top','Top Liked'], ['wins','Wins Only'], ['recent','Recent']].map(([k, label]) => (
                    <button key={k} onClick={() => setView(k)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
                      view === k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {displayed.slice(0, 30).map((p, i) => (
                  <ParlayRow key={p.id} parlay={p} rank={i + 1} currentUserEmail={currentUser?.email} onLike={handleLike} />
                ))}
                {displayed.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No parlays yet.</p>}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}