import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sportKeyMap = {
  'NBA': ['basketball_nba'],
  'MLB': ['baseball_mlb'],
  'NHL': ['icehockey_nhl'],
  'NFL': ['americanfootball_nfl'],
  'NCAAB': ['basketball_ncaab'],
  'NCAAF': ['americanfootball_ncaaf'],
  'WNBA': ['basketball_wnba'],
  'CFL': ['americanfootball_cfl'],
  'MLS': ['soccer_usa_mls'],
  'EPL': ['soccer_epl'],
  'Champions League': ['soccer_uefa_champs_league'],
  'La Liga': ['soccer_spain_la_liga'],
  'Bundesliga': ['soccer_germany_bundesliga'],
  'Serie A': ['soccer_italy_serie_a'],
  'Ligue 1': ['soccer_france_ligue_one'],
  'UFC': ['mma_mixed_martial_arts'],
  'Boxing': ['boxing_boxing'],
  'Tennis': ['tennis_atp_french_open', 'tennis_wta_french_open', 'tennis_atp_wimbledon', 'tennis_wta_wimbledon', 'tennis_atp_us_open', 'tennis_wta_us_open'],
  'Golf': ['golf_pga_championship', 'golf_us_open', 'golf_masters_tournament', 'golf_the_open_championship'],
  'F1': ['motorsport_formula_one_championship'],
  'Rugby': ['rugbyleague_nrl', 'rugbyunion_premiership'],
  'Cricket': ['cricket_ipl'],
  'Aussie Rules': ['aussierules_afl'],
};

const propMarketsMap = {
  'basketball_nba': ['player_points', 'player_rebounds', 'player_assists', 'player_threes', 'player_blocks', 'player_steals', 'player_points_rebounds_assists', 'player_points_alternate', 'player_rebounds_alternate', 'player_assists_alternate', 'player_threes_alternate'],
  'baseball_mlb': ['batter_hits', 'batter_home_runs', 'batter_rbis', 'batter_runs_scored', 'pitcher_strikeouts', 'pitcher_hits_allowed', 'pitcher_walks', 'batter_hits_alternate', 'batter_home_runs_alternate', 'pitcher_strikeouts_alternate'],
  'icehockey_nhl': ['player_shots_on_goal', 'player_points', 'player_goals', 'player_assists', 'player_points_alternate', 'player_goals_alternate', 'player_assists_alternate'],
  'americanfootball_nfl': ['player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions', 'player_reception_yds', 'player_anytime_td', 'player_pass_tds_alternate', 'player_pass_yds_alternate', 'player_rush_yds_alternate', 'player_reception_yds_alternate'],
  'mma_mixed_martial_arts': ['fighter_win_method'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      console.log('Unauthorized - no user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('ODDS_API_KEY_2') || Deno.env.get('ODDS_API_KEY');
    console.log('API Key present:', !!apiKey);
    if (!apiKey) {
      console.log('ODDS_API_KEY not set');
      return Response.json({ error: 'ODDS_API_KEY not set' }, { status: 500 });
    }

    let body = {};
    try { 
      body = await req.json(); 
      console.log('Request body:', body);
    } catch (e) {
      console.log('No body or parse error:', e.message);
    }
    const { sports = [], includeProps = true } = body;
    console.log('Parsed sports:', sports, 'includeProps:', includeProps);

    // Resolve sport keys - fetch ALL sports when none specified
    let keysToFetch = [];
    if (!sports.length) {
      keysToFetch = Object.values(sportKeyMap).flat();
    } else {
      sports.forEach(s => { if (sportKeyMap[s]) keysToFetch.push(...sportKeyMap[s]); });
    }
    keysToFetch = [...new Set(keysToFetch)];
    console.log('Requested sports:', sports);
    console.log('Keys to fetch:', keysToFetch);

    // Get in-season sports
    const sportsRes = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`);
    if (!sportsRes.ok) {
      console.error('Sports API error:', sportsRes.status, sportsRes.statusText);
      return Response.json({ games: [], error: 'Sports API error' });
    }
    const allSports = await sportsRes.json();
    console.log('Available sports:', allSports?.length || 0);
    const inSeasonKeys = new Set(
      Array.isArray(allSports) ? allSports.filter(s => s.active && !s.has_outrights).map(s => s.key) : []
    );
    console.log('In-season sports:', Array.from(inSeasonKeys));

    // Fetch all games - start with basic markets only (h2h, spreads, totals)
    // Then fetch props separately if needed
    const allGames = [];
    await Promise.all(keysToFetch.map(async (sportKey) => {
      if (!inSeasonKeys.has(sportKey)) {
        console.log(`Skipping ${sportKey} - not in season`);
        return;
      }
      // Only fetch basic markets first - props cause 422 errors
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
      console.log(`Fetching ${sportKey} (basic markets)...`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Error fetching ${sportKey}: ${res.status} ${res.statusText}`);
        // If 401, the API key is invalid or expired
        if (res.status === 401) {
          console.error('API key authentication failed. Check ODDS_API_KEY secret.');
        }
        return;
      }
      const games = await res.json();
      console.log(`Sport ${sportKey}: ${games.length} games returned`);
      allGames.push(...games);
    }));

    // Second pass: fetch player props separately for each game if includeProps is true
    if (includeProps && allGames.length > 0) {
      console.log(`Fetching player props for ${allGames.length} games...`);
      await Promise.all(allGames.map(async (game) => {
        const propMarkets = propMarketsMap[game.sport_key] || [];
        if (propMarkets.length === 0) return;
        
        try {
          const propsUrl = `https://api.the-odds-api.com/v4/sports/${game.sport_key}/odds/?apiKey=${apiKey}&regions=us&markets=${propMarkets.join(',')}&oddsFormat=american`;
          const propsRes = await fetch(propsUrl);
          if (!propsRes.ok) return;
          const propsGames = await propsRes.json();
          const matchingGame = propsGames.find(pg => pg.id === game.id);
          if (matchingGame) {
            game.playerPropsData = matchingGame.bookmakers?.[0]?.markets || [];
          }
        } catch (e) {
          console.error(`Error fetching props for ${game.id}:`, e.message);
        }
      }));
    }

    const simplified = allGames.map(g => {
      const allMarkets = g.bookmakers?.[0]?.markets || [];
      const gameOdds = allMarkets
        .filter(m => ['h2h', 'spreads', 'totals'].includes(m.key))
        .map(m => ({ market: m.key, outcomes: m.outcomes.map(o => ({ name: o.name, price: o.price, point: o.point })) }));
      // Use playerPropsData fetched in second pass, or empty array if not available
      const propsMarkets = g.playerPropsData || [];
      const playerProps = propsMarkets
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

    console.log(`Total games returned: ${simplified.length}`);

    // If no games, return error message about API key
    if (simplified.length === 0) {
      return Response.json({ 
        games: [], 
        error: 'No games available. The Odds API key may be invalid, expired, or rate-limited. Please check your API key or try again later.'
      });
    }

    return Response.json({ games: simplified });
  } catch (err) {
    console.log('Error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});