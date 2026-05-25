import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tableName, projectRef, limit = 100 } = await req.json();
    if (!tableName) return Response.json({ error: 'tableName is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    // Auto-discover project ref if not provided
    let ref = projectRef;
    if (!ref) {
      const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const projects = await projectsRes.json();
      if (!projects?.length) return Response.json({ error: 'No Supabase projects found' }, { status: 404 });
      ref = projects[0].ref;
    }

    // Get service_role key to query data
    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const keys = await keysRes.json();
    const serviceKey = keys.find(k => k.name === 'service_role')?.api_key;
    if (!serviceKey) return Response.json({ error: 'Could not retrieve service_role key' }, { status: 500 });

    // Fetch rows from table via PostgREST
    const dataRes = await fetch(`https://${ref}.supabase.co/rest/v1/${tableName}?limit=${limit}`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    });
    const rows = await dataRes.json();
    if (!Array.isArray(rows)) {
      return Response.json({ error: `Failed to fetch table data: ${JSON.stringify(rows)}` }, { status: 500 });
    }

    if (!rows.length) return Response.json({ imported: 0, message: 'Table is empty, nothing to import.' });

    // Use AI to map rows to ParlayRecord schema
    const sampleRow = rows[0];
    const mappingRes = await base44.asServiceRole.functions.invoke('invokeLLMMapping', {
      rows: rows.slice(0, 5),
      tableName
    });

    // Map each row and create ParlayRecord entities
    let imported = 0;
    for (const row of rows) {
      // Build a best-effort ParlayRecord from row data
      const record = {
        title: row.title || row.name || row.parlay_title || row.description || `${tableName} #${row.id || imported + 1}`,
        sport: row.sport || row.league || row.category || '',
        totalOdds: row.total_odds || row.odds || row.payout || '',
        legs: Array.isArray(row.legs) ? row.legs : (row.picks ? [{ pick: row.picks }] : []),
        result: ['win', 'loss'].includes(row.result?.toLowerCase?.()) ? row.result.toLowerCase() : undefined,
        date: row.date || row.created_at || new Date().toISOString(),
        likes: []
      };
      await base44.asServiceRole.entities.ParlayRecord.create(record);
      imported++;
    }

    return Response.json({ imported, total: rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});