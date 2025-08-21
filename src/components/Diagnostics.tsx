import React, { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase'; // keep your existing path/import style

type CheckResult = {
  mode: 'db' | 'local';
  urlHost?: string;
  schema?: string;
  envConfigured: boolean;
  auth: { hasSession: boolean; userId?: string; email?: string; error?: string };
  org: { hasOrg: boolean; orgId?: string; error?: string };
  providers: { count?: number; error?: string };
  timestamp: string;
};

const ms = (n: number) => new Promise(r => setTimeout(r, n));
const withTimeout = async <T,>(p: Promise<T>, timeoutMs = 10_000) => {
  let t: any;
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => { t = setTimeout(() => rej(new Error('timeout')), timeoutMs); })
  ]).finally(() => clearTimeout(t));
};

function hostFrom(url?: string | null) {
  try { return url ? new URL(url).host : undefined; } catch { return undefined; }
}

export default function Diagnostics() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const envConfigured = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('temp_supabase_url');
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('temp_supabase_key');
    return !!(url && key && String(url).startsWith('https://') && String(key).length > 80);
  }, []);

  async function run() {
    setRunning(true);
    const url = (import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('temp_supabase_url')) as string | null;
    const schema = (import.meta.env.VITE_DB_SCHEMA ?? 'public') as string;
    const base: CheckResult = {
      mode: supabase ? 'db' : 'local',
      urlHost: hostFrom(url),
      schema,
      envConfigured,
      auth: { hasSession: false },
      org: { hasOrg: false },
      providers: {},
      timestamp: new Date().toISOString(),
    };

    try {
      if (!supabase) {
        setResult(base);
        setRunning(false);
        return;
      }

      // 1) Session
      const { data: sessionData, error: sessionErr } = await withTimeout(supabase.auth.getSession());
      if (sessionErr) base.auth.error = sessionErr.message;
      base.auth.hasSession = !!sessionData?.session;
      base.auth.userId = sessionData?.session?.user?.id;
      base.auth.email = sessionData?.session?.user?.email ?? undefined;

      // Early exit: no session means RLS will block; still useful to see.
      if (!base.auth.hasSession) {
        setResult(base);
        setRunning(false);
        return;
      }

      // Org membership check (old → new)
      const { data: orgRows, error: orgErr } = await withTimeout(
        supabase.from('org_members').select('organization_id').eq('user_id', base.auth.userId!).limit(1)
      );
      if (orgErr) base.org.error = orgErr.message;
      base.org.orgId = orgRows?.[0]?.organization_id;
      base.org.hasOrg = !!base.org.orgId;
      
      // Providers count scoped by org (old → new)
      if (base.org.orgId) {
        const { count, error: provErr } = await withTimeout(
          supabase
            .from('providers')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', base.org.orgId)
        );
        if (provErr) base.providers.error = provErr.message;
        base.providers.count = typeof count === 'number' ? count : undefined;
      }

      // small delay to keep UI readable if everything is instant
      await ms(50);
    } catch (e: any) {
      // fall through — all errors are attached in sections above where possible
      base.providers.error = base.providers.error || e?.message || String(e);
    } finally {
      setResult(base);
      setRunning(false);
    }
  }

  function copy() {
    if (!result) return;
    const redacted = { ...result };
    // nothing sensitive is included, anon key is not printed
    navigator.clipboard.writeText(JSON.stringify(redacted, null, 2));
  }

  // Floating button + simple panel (Tailwind classes assumed in your app)
  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-4 right-4 z-50 rounded-full px-4 py-2 bg-goldenrod text-navy shadow-lg"
        title="Diagnostics"
      >
        {open ? 'Close Diagnostics' : 'Diagnostics'}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] max-h-[70vh] overflow-auto rounded-xl border border-dark-cyan/30 bg-navy-light p-4 text-cream shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Runtime Diagnostics</h3>
            <button onClick={run} disabled={running}
              className="px-3 py-1 rounded bg-dark-cyan/20 border border-dark-cyan/30">
              {running ? 'Running…' : 'Run Checks'}
            </button>
          </div>

          {result ? (
            <pre className="text-xs whitespace-pre-wrap bg-navy-dark/50 p-3 rounded border border-dark-cyan/20">
{JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-cream/80">Click “Run Checks” to gather environment, auth, org, and providers info.</p>
          )}

          <div className="mt-3 flex gap-2">
            <button onClick={copy} disabled={!result}
              className="px-3 py-1 rounded bg-goldenrod text-navy disabled:bg-goldenrod/40">
              Copy JSON
            </button>
            <span className="text-cream/60 text-xs">Paste that JSON here if something looks off.</span>
          </div>
        </div>
      )}
    </>
  );
}
