import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sportKeyMap = {
  'NBA': 'basketball_nba',
  'MLB': 'baseball_mlb',
  'NHL': 'icehockey_nhl',
  'NFL': 'americanfootball_nfl',
  'Soccer': 'soccer_usa_mls',
  'UFC': 'mma_mixed_martial_arts',
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
    const { sports = Object.keys(sportKeyMap) } = body;

    const allScores = [];
    for (const sport of sports) {
      const sportKey = sportKeyMap[sport];
      if (!sportKey) continue;
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=3&dateFormat=iso`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const scores = await res.json();
      const completed = scores.filter(g => g.completed);
      allScores.push(...completed.map(g => ({
        sport: g.sport_title,
        home: g.home_team,
        away: g.away_team,
        commenceTime: g.commence_time,
        completed: g.completed,
        scores: g.scores?.map(s => ({ name: s.name, score: s.score })) || []
      })));
    }

    return Response.json({ scores: allScores });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});