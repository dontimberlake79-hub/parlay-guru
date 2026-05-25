import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    // Get projects
    const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const projects = await projectsRes.json();
    if (!projects?.length) return Response.json({ error: 'No Supabase projects found' }, { status: 404 });

    const project = projects[0];
    const projectRef = project.ref;

    // Get tables via read-only query
    const schemaRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query/read-only`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
      })
    });
    const schemaData = await schemaRes.json();
    const tables = (schemaData || []).map(row => row.table_name).filter(Boolean);

    return Response.json({ project: { ref: projectRef, name: project.name }, tables });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});