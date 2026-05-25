import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Database, RefreshCw, Download, CheckCircle, AlertCircle, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Import() {
  const [project, setProject] = useState(null);
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [importLimit, setImportLimit] = useState(100);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoadingTables(true);
    setError(null);
    const res = await base44.functions.invoke('supabaseListTables', {});
    if (res?.data?.error) {
      setError(res.data.error);
    } else {
      setProject(res?.data?.project);
      setTables(res?.data?.tables || []);
    }
    setLoadingTables(false);
  };

  const handleImport = async () => {
    if (!selectedTable) return;
    setImporting(true);
    setResult(null);
    setError(null);
    const res = await base44.functions.invoke('supabaseImport', {
      tableName: selectedTable,
      projectRef: project?.ref,
      limit: importLimit
    });
    if (res?.data?.error) {
      setError(res.data.error);
    } else {
      setResult(res?.data);
    }
    setImporting(false);
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-all">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-foreground text-lg">Import from Supabase</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Project info */}
        {project && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/25">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-foreground">{project.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{project.ref}.supabase.co</p>
            </div>
            <button onClick={fetchTables} className="ml-auto text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-4 h-4 ${loadingTables ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {loadingTables && !project && (
          <div className="flex flex-col items-center py-16 gap-3">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Connecting to Supabase...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/25">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Table selection */}
        {tables.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select a Table to Import</h2>
            <div className="grid gap-2">
              {tables.map(table => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedTable === table
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <Table className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-sm">{table}</span>
                  {selectedTable === table && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Limit + Import */}
        {selectedTable && (
          <section className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                Row Limit
              </label>
              <div className="flex gap-2">
                {[50, 100, 250, 500].map(n => (
                  <button
                    key={n}
                    onClick={() => setImportLimit(n)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      importLimit === n
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full h-12 font-display font-bold text-base gap-2"
            >
              {importing
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</>
                : <><Download className="w-4 h-4" /> Import "{selectedTable}"</>
              }
            </Button>
          </section>
        )}

        {/* Success result */}
        {result && (
          <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-primary/10 border border-primary/25">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Import complete!</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {result.imported} record{result.imported !== 1 ? 's' : ''} imported from <span className="font-mono text-foreground">{selectedTable}</span>.
              </p>
              {result.message && <p className="text-xs text-muted-foreground mt-1">{result.message}</p>}
              <Link to="/" className="inline-block mt-3 text-xs font-semibold text-primary hover:underline">
                View on Home →
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}