// DevDebug.tsx
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase"; // your client

export default function DevDebug() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [providersCount, setProvidersCount] = useState<any>(null);
  const [memberships, setMemberships] = useState<any>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;

      const providers = await supabase
        .from("providers")
        .select("id", { count: "exact", head: true });

      let mems = null;
      if (uid) {
        const { data } = await supabase
          .from("org_memberships")
          .select("org_id, role")
          .eq("user_id", uid);
        mems = data ?? [];
      }

      // If your UI tracks an org selector, surface it here:
      const orgId =
        (mems && mems[0]?.org_id) ||
        null;

      setSessionInfo({ uid, email: session?.user?.email ?? null });
      setProvidersCount({ count: providers.count, error: providers.error });
      setMemberships(mems);
      setActiveOrgId(orgId);
    })();
  }, []);

  return (
    <div style={{position:"fixed",bottom:8,right:8,background:"#111827",color:"#e5e7eb",padding:12,borderRadius:12,fontSize:12,opacity:.9,zIndex:9999}}>
      <div><b>SB URL:</b> {import.meta.env.VITE_SUPABASE_URL || "MISSING"}</div>
      <div><b>User ID:</b> {sessionInfo?.uid || "null"}</div>
      <div><b>Email:</b> {sessionInfo?.email || "null"}</div>
      <div><b>org_memberships:</b> {JSON.stringify(memberships)}</div>
      <div><b>activeOrgId (guessed):</b> {activeOrgId || "null"}</div>
      <div><b>providers count:</b> {providersCount?.count ?? "?"}</div>
      <div><b>providers error:</b> {providersCount?.error?.code || "none"}</div>
    </div>
  );
}
