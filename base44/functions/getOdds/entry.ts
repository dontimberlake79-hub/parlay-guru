import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sportKeyMap = {
  'NBA': ['basketball_nba'],
  'MLB': ['baseball_mlb'],
  'NHL': ['icehockey_nhl'],
  'NFL': ['americanfootball_nfl'],
  'Soccer': ['soccer_usa_mls'],
  'UFC': ['mma_mixed_martial_arts'],
  'Tennis': ['tennis_atp_french_open', 'tennis_wta_french_open'],
};

const propMarketsMap = {
  'basketball_nba': ['player_points', 'player_rebounds', 'player_assists', 'player_threes', 'player_blocks', 'player_steals', 'player_points_rebounds_assists'],
  'baseball_mlb': ['batter_hits', 'batter_home_runs', 'batter_rbis', 'batter_runs_scored', 'pitcher_strikeouts', 'pitcher_hits_allowed', 'pitcher_walks'],
  'icehockey_nhl': ['player_shots_on_goal', 'player_points', 'player_goals', 'player_assists'],
  'americanfootball_nfl': ['player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions', 'player_reception_yds', 'player_anytime_td'],
  'mma_mixed_martial_arts': ['fighter_win_method'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('ODDS_API_KEY_2') || Deno.env.get('ODDS_API_KEY');
    if (!apiKey) return Response.json({ error: 'ODDS_API_KEY not set' }, { status: 500 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { sports = [], includeProps = true } = body;

    // Resolve sport keys - fetch ALL sports when none specified
    let keysToFetch = [];
    if (!sports.length) {
      keysToFetch = Object.values(sportKeyMap).flat();
    } else {
      sports.forEach(s => { if (sportKeyMap[s]) keysToFetch.push(...sportKeyMap[s]); });
    }
    keysToFetch = [...new Set(keysToFetch)];

    // Get in-season sports
    const sportsRes = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`);
    if (!sportsRes.ok) return Response.json({ games: [], error: 'Sports API error' });
    const allSports = await sportsRes.json();
    const inSeasonKeys = new Set(
      Array.isArray(allSports) ? allSports.filter(s => s.active).map(s => s.key) : []
    );

    // Fetch all games with all prop markets in parallel using comma-separated markets list
    const allGames = [];
    await Promise.all(keysToFetch.map(async (sportKey) => {
      if (!inSeasonKeys.has(sportKey)) return;
      // Build comprehensive markets list: h2h, spreads, totals, plus ALL prop markets for this sport
      const propMarkets = includeProps && propMarketsMap[sportKey] ? propMarketsMap[sportKey] : [];
      const allMarkets = ['h2h', 'spreads', 'totals', ...propMarkets];
      const markets = allMarkets.join(',');
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=american&daysFrom=7`;
      const res = await fetch(url);
      if (!res.ok) return;
      const games = await res.json();
      allGames.push(...games);
    }));

    const simplified = allGames.map(g => {
      const allMarkets = g.bookmakers?.[0]?.markets || [];
      const gameOdds = allMarkets
        .filter(m => ['h2h', 'spreads', 'totals'].includes(m.key))
        .map(m => ({ market: m.key, outcomes: m.outcomes.map(o => ({ name: o.name, price: o.price, point: o.point })) }));
      const playerProps = allMarkets
        .filter(m => !['h2h', 'spreads', 'totals'].includes(m.key))
        .map(m => ({ market: m.key, outcomes: m.outcomes.slice(0, 20).map(o => ({ name: o.name, description: o.description, price: o.price, point: o.point })) }));
      return {
        id: g.id,
        sport: g.sport_title,
        sportKey: g.sport_key,
        home: g.home_team,
        away: g.away_team,
        commenceTime: g.commence_time,
        odds: gameOdds,
        playerProps
      };
    });

    return Response.json({ games: simplified });
  } catch (err) {
    console.log('Error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});