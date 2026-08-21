import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Activity } from "lucide-react";

/**
 * Widget indicatore stato di salute dei servizi critici.
 * Mostra pallini verdi/rossi + latenza per DB, Stripe, PayPal, Resend.
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
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-2 text-xs text-white/60">
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
  ];

  const allOk = services.every((s) => health[s.key]?.ok);

  return (
    <div
      data-testid="health-widget"
      className={`rounded-xl border p-3 flex items-center gap-3 flex-wrap ${allOk ? "border-green-500/40 bg-green-500/5" : "border-yellow-500/40 bg-yellow-500/5"}`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
        <Activity size={14} className={allOk ? "text-green-400" : "text-yellow-400"} />
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
              <span className="text-white/80">{s.label}</span>
              {st.ok && st.ms != null && <span className="text-white/40">{st.ms}ms</span>}
              {!st.ok && <span className="text-red-300/80">{st.error || "offline"}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
