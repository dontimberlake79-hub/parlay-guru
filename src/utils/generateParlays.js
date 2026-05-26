// Local parlay generator — uses real odds data, no AI needed

const PARLAY_TITLES = [
  "Cash Register Special", "Lock of the Night", "The Daily Hammer",
  "Sharp Money Alert", "Value Bomb", "Chalk & Cheese Combo",
  "The Grinder", "Morning Line Special", "Prime Time Parlay",
  "The Moneymaker", "Bankroll Builder", "Overnight Express",
  "The Closer", "Fade the Public", "Smart Money Plays"
];

const LEG_REASONS = [
  "Strong recent form and favorable matchup",
  "Public fading this side — sharp money disagrees",
  "Historically covers at home in this spot",
  "Line movement suggests professional action",
  "Key injury on the other side not fully priced in",
  "Back-to-back fatigue factor working against opponent",
  "Elite efficiency metrics support this number",
  "Pace mismatch favors this pick heavily",
  "Revenge game spot — extra motivation here",
  "Weather conditions and travel edge factor in"
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function impliedProb(americanOdds) {
  const n = parseInt(americanOdds.replace('+', ''));
  if (n > 0) return 100 / (n + 100);
  return Math.abs(n) / (Math.abs(n) + 100);
}

function combineProbs(probs) {
  return probs.reduce((acc, p) => acc * p, 1) * 100;
}

function formatAmericanOdds(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

function combinedAmericanOdds(legs) {
  // Approximate parlay odds from individual american odds
  let decimal = 1;
  for (const leg of legs) {
    const o = parseInt(leg.odds.replace('+', ''));
    const d = o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1;
    decimal *= d;
  }
  const american = Math.round((decimal - 1) * 100);
  return formatAmericanOdds(american);
}

function pickLegsFromGame(game, count) {
  const legs = [];
  const odds = game.odds?.[0] || {};

  const options = [];

  // Moneyline home
  if (odds.homeMoneyline) options.push({
    pick: `${game.homeTeam} ML`,
    matchup: `${game.awayTeam} @ ${game.homeTeam}`,
    odds: formatAmericanOdds(odds.homeMoneyline),
    isPlayerProp: false
  });

  // Moneyline away
  if (odds.awayMoneyline) options.push({
    pick: `${game.awayTeam} ML`,
    matchup: `${game.awayTeam} @ ${game.homeTeam}`,
    odds: formatAmericanOdds(odds.awayMoneyline),
    isPlayerProp: false
  });

  // Spread home
  if (odds.homeSpread !== undefined && odds.homeSpreadOdds) {
    const spread = odds.homeSpread > 0 ? `+${odds.homeSpread}` : `${odds.homeSpread}`;
    options.push({
      pick: `${game.homeTeam} ${spread}`,
      matchup: `${game.awayTeam} @ ${game.homeTeam}`,
      odds: formatAmericanOdds(odds.homeSpreadOdds),
      isPlayerProp: false
    });
  }

  // Player props
  if (game.playerProps?.length > 0) {
    const prop = randomFrom(game.playerProps);
    const playerName = prop.playerName || prop.player || 'Player';
    const line = prop.over?.line ?? prop.line ?? '';
    const propOdds = prop.over?.odds ?? prop.odds ?? -115;
    if (line) {
      options.push({
        pick: `${playerName} Over ${line} ${prop.type || 'Points'}`,
        matchup: `${game.awayTeam} @ ${game.homeTeam}`,
        odds: formatAmericanOdds(propOdds),
        isPlayerProp: true
      });
    }
  }

  // Shuffle and return up to count
  const shuffled = options.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function generateFakeParlays(games, risk = 'safe') {
  if (!games || games.length === 0) return [];

  const shuffled = [...games].sort(() => Math.random() - 0.5);
  const parlays = [];

  const configs = [
    { parlayType: 'quick_hit', legsNeeded: 2 },
    { parlayType: 'quick_hit', legsNeeded: 2 },
    { parlayType: 'quick_hit', legsNeeded: 2 },
    { parlayType: 'main_slate', legsNeeded: 3 },
    { parlayType: 'main_slate', legsNeeded: 3 },
    { parlayType: 'power_parlay', legsNeeded: 4 },
  ];

  for (const config of configs) {
    const legs = [];
    const usedGameIds = new Set();

    for (const game of shuffled) {
      if (usedGameIds.has(game.id)) continue;
      const gameLeg = pickLegsFromGame(game, 1);
      if (gameLeg.length > 0) {
        legs.push({ ...gameLeg[0], legReason: randomFrom(LEG_REASONS), confidence: Math.floor(Math.random() * 30) + 55, hotStreak: Math.random() > 0.6 ? 1 : 0 });
        usedGameIds.add(game.id);
      }
      if (legs.length >= config.legsNeeded) break;
    }

    if (legs.length < 2) continue;

    const probs = legs.map(l => impliedProb(l.odds));
    const winProb = Math.round(combineProbs(probs));
    const totalOdds = combinedAmericanOdds(legs);
    const sport = shuffled.find(g => legs.some(l => l.matchup?.includes(g.homeTeam)))?.sport || 'Multi';

    parlays.push({
      title: randomFrom(PARLAY_TITLES),
      sport,
      parlayType: config.parlayType,
      legs,
      totalOdds,
      winProbability: winProb,
      valueRating: Math.floor(Math.random() * 3) + 2,
      reasoning: "Generated from live market odds. Always shop lines and manage your bankroll."
    });
  }

  return parlays;
}