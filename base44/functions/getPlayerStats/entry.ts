import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = Deno.env.get('BALLDONTLIE_API_KEY');
        if (!apiKey) {
            return Response.json({ 
                stats: null,
                error: 'API key not configured'
            });
        }

        const { playerName, propLine, propType } = await req.json();
        if (!playerName) {
            return Response.json({ error: 'Player name required' }, { status: 400 });
        }

        // Map prop types to API fields
        const fieldMap = {
            'Points': 'pts',
            'Assists': 'ast',
            'Rebounds': 'reb',
            'Three Pointers Made': 'fg3m'
        };
        const field = fieldMap[propType] || 'pts';

        // Search for player
        const playerSearch = await fetch(
            `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(playerName.split(' ')[0])}&per_page=100`,
            { headers: { 'Authorization': apiKey } }
        );
        const playerData = await playerSearch.json();
        
        if (!playerData.data || playerData.data.length === 0) {
            return Response.json({ stats: null, error: 'Player not found' });
        }

        // Find best match by full name
        const player = playerData.data.find(p => 
            p.first_name + ' ' + p.last_name === playerName
        ) || playerData.data[0];

        // Get last 25 games (API limitation, we'll filter to last 10)
        const statsResponse = await fetch(
            `https://api.balldontlie.io/v1/stats?player_ids=${player.id}&per_page=25`,
            { headers: { 'Authorization': apiKey } }
        );
        const statsData = await statsResponse.json();

        if (!statsData.data || statsData.data.length === 0) {
            return Response.json({ stats: null, error: 'No stats available' });
        }

        // Get last 10 games
        const last10Games = statsData.data.slice(0, 10);
        
        // Calculate averages
        const totalGames = last10Games.length;
        const sumStats = last10Games.reduce((acc, game) => ({
            pts: acc.pts + (game.pts || 0),
            ast: acc.ast + (game.ast || 0),
            reb: acc.reb + (game.reb || 0),
            fg3m: acc.fg3m + (game.fg3m || 0)
        }), { pts: 0, ast: 0, reb: 0, fg3m: 0 });

        const averages = {
            pointsPerGame: (sumStats.pts / totalGames).toFixed(1),
            assistsPerGame: (sumStats.ast / totalGames).toFixed(1),
            reboundsPerGame: (sumStats.reb / totalGames).toFixed(1),
            threePointersPerGame: (sumStats.fg3m / totalGames).toFixed(1)
        };

        // Count how many times player went over prop line
        const statKey = field;
        const overCount = last10Games.filter(game => {
            const value = game[statKey] || 0;
            return value > (parseFloat(propLine) || 0);
        }).length;

        // Determine hot streak
        let hotStreak = 0;
        if (overCount >= 9) hotStreak = 2;
        else if (overCount >= 7) hotStreak = 1;

        return Response.json({
            stats: {
                playerName,
                gamesPlayed: totalGames,
                ...averages,
                propLine: parseFloat(propLine) || 0,
                propType,
                overCount,
                overPercentage: Math.round((overCount / totalGames) * 100),
                hotStreak
            }
        });
    } catch (error) {
        return Response.json({ 
            stats: null,
            error: error.message 
        }, { status: 500 });
    }
});