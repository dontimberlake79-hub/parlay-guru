import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPORT_KEYS = [
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'americanfootball_nfl',
  'soccer_usa_mls',
  'mma_mixed_martial_arts',
  'tennis_atp_french_open',
  'tennis_wta_french_open',
];

const sportKeyMap = {
  'NBA': ['basketball_nba'],
  'MLB': ['baseball_mlb'],
  'NHL': ['icehockey_nhl'],
  'NFL': ['americanfootball_nfl'],
  'Soccer': ['soccer_usa_mls'],
  'UFC': ['mma_mixed_martial_arts'],
  'Tennis': ['tennis_atp_french_open', 'tennis_wta_french_open'],
  'Player Props': ['basketball_nba', 'baseball_mlb', 'icehockey_nhl'],
  'All Sports': SPORT_KEYS,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('ODDS_API_KEY');
    if (!apiKey) return Response.json({ error: 'ODDS_API_KEY not set' }, { status: 500 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const sport = body.sport || 'All Sports';

    const keysToFetch = sportKeyMap[sport] || SPORT_KEYS;

    // Fetch in-season sports
    const sportsRes = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`);
    console.log('Sports endpoint status:', sportsRes.status);
    if (!sportsRes.ok) {
      const errText = await sportsRes.text();
      console.log('Sports API error:', errText);
      return Response.json({ games: [], error: errText });
    }
    const allSports = await sportsRes.json();
    console.log('Total sports returned:', allSports.length);
    const inSeasonKeys = new Set(
      Array.isArray(allSports) ? allSports.filter(s => s.active).map(s => s.key) : []
    );
    console.log('In-season keys:', [...inSeasonKeys].join(', '));

    const allGames = [];
    for (const sportKey of keysToFetch) {
      if (!inSeasonKeys.has(sportKey)) {
        console.log('Skipping (not in season):', sportKey);
        continue;
      }
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&daysFrom=2`;
      const res = await fetch(url);
      console.log(`Odds for ${sportKey}: status ${res.status}`);
      if (!res.ok) { console.log(await res.text()); continue; }
      const games = await res.json();
      console.log(`  → ${games.length} games found`);
      allGames.push(...games.slice(0, 6));
    }

    const simplified = allGames.map(g => ({
      sport: g.sport_title,
      home: g.home_team,
      away: g.away_team,
      commenceTime: g.commence_time,
      odds: (g.bookmakers?.[0]?.markets || []).map(m => ({
        market: m.key,
        outcomes: m.outcomes.map(o => ({ name: o.name, price: o.price, point: o.point }))
      }))
    }));

    return Response.json({ games: simplified });
  } catch (err) {
    console.log('Unhandled error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});