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
    const { sports = [], includeProps = false } = body;

    // Resolve sport keys
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

    const allGames = [];
    for (const sportKey of keysToFetch) {
      if (!inSeasonKeys.has(sportKey)) continue;
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&daysFrom=7`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const games = await res.json();
      allGames.push(...games.slice(0, 20));
    }

    // Fetch player props for top games if requested
    const propsData = {};
    if (includeProps) {
      await Promise.all(allGames.slice(0, 15).map(async (game) => {
        const propMarkets = propMarketsMap[game.sport_key];
        if (!propMarkets) return;

        // Fetch each market in parallel
        const marketResponses = await Promise.all(
          propMarkets.map(market =>
            fetch(`https://api.the-odds-api.com/v4/sports/${game.sport_key}/events/${game.id}/odds?apiKey=${apiKey}&regions=us&markets=${market}&oddsFormat=american`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );

        const allMarkets = [];
        for (const data of marketResponses) {
          if (!data) continue;
          const bookmaker = data.bookmakers?.[0];
          if (bookmaker) {
            for (const m of bookmaker.markets) {
              allMarkets.push({
                market: m.key,
                outcomes: m.outcomes.slice(0, 20).map(o => ({ name: o.name, description: o.description, price: o.price, point: o.point }))
              });
            }
          }
        }

        if (allMarkets.length > 0) {
          propsData[game.id] = allMarkets;
        }
      }));
    }

    const simplified = allGames.map(g => ({
      id: g.id,
      sport: g.sport_title,
      sportKey: g.sport_key,
      home: g.home_team,
      away: g.away_team,
      commenceTime: g.commence_time,
      odds: (g.bookmakers?.[0]?.markets || []).map(m => ({
        market: m.key,
        outcomes: m.outcomes.map(o => ({ name: o.name, price: o.price, point: o.point }))
      })),
      playerProps: propsData[g.id] || []
    }));

    return Response.json({ games: simplified });
  } catch (err) {
    console.log('Error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});