import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Eye, Users, MousePointerClick, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const CLICK_LABELS = {
  subscribe_click: "Click su Abbonati",
  qr_generated: "QR sconto generati",
  register_started: "Registrazioni iniziate",
  flyer_print: "Stampa locandina",
  discount_click: "Click su uno sconto",
};

function Bars({ days, values, color }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-28 items-end gap-[2px]">
      {values.map((v, i) => (
        <div
          key={days[i]}
          title={`${days[i].split("-").reverse().join("/")}: ${v}`}
          className={`flex-1 rounded-t-sm ${color} transition-all`}
          style={{ height: `${Math.max(2, (v / max) * 100)}%`, opacity: v === 0 ? 0.15 : 0.85 }}
        />
      ))}
    </div>
  );
}

export default function AdminTraffic({ hdrs }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/traffic", hdrs())
      .then((r) => setData(r.data))
      .catch((err) => toast.error(formatApiError(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caricamento singolo al mount
  }, []);

  if (!data) return <div className="text-white/60">Caricamento…</div>;

  const kpi = [
    { icon: Users, label: "Visitatori unici oggi", value: data.today.visitors, color: "text-ciano" },
    { icon: Eye, label: "Aperture app oggi", value: data.today.opens, color: "text-fucsia" },
    { icon: BarChart3, label: "Pagine viste (30gg)", value: data.totals_30d.pageviews, color: "text-gold" },
    { icon: MousePointerClick, label: "Aperture (30gg)", value: data.totals_30d.opens, color: "text-emerald-400" },
  ];

  return (
    <div data-testid="admin-traffic" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((c) => (
          <Card key={c.label} className="border-white/10 bg-white/5 p-5">
            <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${c.color}`}>
              <c.icon size={14} /> {c.label}
            </div>
            <div className="mt-2 font-serif text-4xl text-white">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-[#141414] p-5">
          <div className="text-xs uppercase tracking-wider text-ciano">Visitatori unici — ultimi 30 giorni</div>
          <div className="mt-4"><Bars days={data.days} values={data.series.visitors} color="bg-ciano" /></div>
        </Card>
        <Card className="border-white/10 bg-[#141414] p-5">
          <div className="text-xs uppercase tracking-wider text-fucsia">Aperture app — ultimi 30 giorni</div>
          <div className="mt-4"><Bars days={data.days} values={data.series.opens} color="bg-fucsia" /></div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-[#141414] p-5">
          <div className="text-xs uppercase tracking-wider text-gold">Pagine più viste (30gg)</div>
          <div className="mt-3 space-y-1.5">
            {data.top_pages.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-sm">
                <span className="truncate text-white/70 font-mono text-xs">{p.path}</span>
                <span className="ml-3 font-bold text-white">{p.count}</span>
              </div>
            ))}
            {data.top_pages.length === 0 && <div className="text-sm text-white/40">Ancora nessun dato.</div>}
          </div>
        </Card>
        <Card className="border-white/10 bg-[#141414] p-5">
          <div className="text-xs uppercase tracking-wider text-emerald-400">Click chiave (30gg)</div>
          <div className="mt-3 space-y-1.5">
            {data.clicks.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{CLICK_LABELS[c.name] || c.name}</span>
                <span className="ml-3 font-bold text-white">{c.count}</span>
              </div>
            ))}
            {data.clicks.length === 0 && <div className="text-sm text-white/40">Ancora nessun click tracciato.</div>}
          </div>
        </Card>
      </div>
      <p className="text-xs text-white/40">
        Analytics first-party anonima: ID visitatore casuale non collegato agli account, nessun dato personale,
        nessun servizio esterno — coerente con la Cookie Policy.
      </p>
    </div>
  );
}
