import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Activity } from "lucide-react";

/**
 * Widget indicatore stato di salute dei servizi critici.
 * Mostra pallini verdi/rossi + latenza per DB, Stripe, PayPal, Resend, LocationIQ
 * e il numero di email non partite nelle ultime 24 ore.
 * Si aggiorna ogni 30s.
 */
export default function HealthWidget() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const { data } = await api.get("/admin/health");
      setHealth(data);
    } catch (e) {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const t = setInterval(fetchHealth, 30000);
    return () => clearInterval(t);
  }, []);

  if (loading || !health) {
    return (
      <div className="rounded-xl border border-border bg-muted p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="animate-spin" size={14} />
        Health check…
      </div>
    );
  }

  const services = [
    { key: "db", label: "Database" },
    { key: "stripe", label: "Stripe" },
    { key: "paypal", label: "PayPal" },
    { key: "resend", label: "Email (Resend)" },
    { key: "locationiq", label: "Indirizzi (LocationIQ)" },
  ];

  // Email non partite (invio Resend fallito) nelle ultime 24 ore: solo numeri, tipo di email e codice d'errore.
  const fallite = health.email_fallite || {};
  const nFallite = fallite.ultime_24h || 0;
  const allOk = services.every((s) => health[s.key]?.ok) && nFallite === 0;

  return (
    <div
      data-testid="health-widget"
      className={`rounded-xl border p-3 flex items-center gap-3 flex-wrap ${allOk ? "border-green-500/40 bg-green-500/5" : "border-yellow-500/40 bg-yellow-500/5"}`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Activity size={14} className={allOk ? "text-emerald-700" : "text-amber-800"} />
        Server Health
      </div>
      <div className="flex flex-wrap gap-3">
        {services.map((s) => {
          const st = health[s.key] || {};
          const isWarn = !st.ok && st.warning;
          const color = st.ok ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" : isWarn ? "bg-yellow-400" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]";
          return (
            <div key={s.key} data-testid={`health-${s.key}`} className="flex items-center gap-2 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-foreground/80">{s.label}</span>
              {st.ok && st.ms != null && <span className="text-muted-foreground">{st.ms}ms</span>}
              {st.ok && st.note && <span className="text-[10px] text-muted-foreground">({st.note})</span>}
              {!st.ok && <span className="text-red-700">{st.error || "offline"}</span>}
            </div>
          );
        })}
        <div data-testid="health-email-fallite" className="flex items-center gap-2 text-xs">
          <span className={`h-2.5 w-2.5 rounded-full ${nFallite === 0 ? "bg-green-400" : "bg-red-500"}`} />
          <span className="text-foreground/80">Email non partite (24 h)</span>
          <span className={nFallite === 0 ? "text-muted-foreground" : "text-red-700 font-semibold"}>{nFallite}</span>
          {nFallite > 0 && (
            <span className="text-[10px] text-muted-foreground">
              (ultima ora: {fallite.ultima_ora || 0}; {Object.entries(fallite.per_tipo || {}).map(([k, v]) => `${k} ${v}`).join(", ")})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
