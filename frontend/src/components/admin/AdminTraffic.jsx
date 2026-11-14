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
  whatsapp_commercianti_alto: "WhatsApp dalla pagina commercianti (in alto)",
  whatsapp_commercianti_basso: "WhatsApp dalla pagina commercianti (in basso)",
  registra_commercianti_alto: "«Iscrivi il tuo negozio» dalla pagina commercianti (in alto)",
  registra_commercianti_basso: "«Registra la tua attività» dalla pagina commercianti (in basso)",
  register_merchant_step1: "Iscrizione negozio: passo 1 completato",
  register_merchant_whatsapp: "WhatsApp dall'iscrizione negozio",
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

/** Menu dell'archivio: i mesi passati con dati. Vuoto = mese in corso. */
export function ArchivioMesi({ archivio, mese, onScegli, testid }) {
  if (!archivio || archivio.length === 0) return null;
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      Archivio mesi precedenti:
      <select data-testid={testid} value={mese || ""} onChange={(e) => onScegli(e.target.value || null)}
        className="min-h-11 rounded-lg border border-border bg-card px-3 text-foreground">
        <option value="">Mese in corso</option>
        {archivio.map((a) => <option key={a.mese} value={a.mese}>{a.etichetta}</option>)}
      </select>
    </label>
  );
}

export default function AdminTraffic({ hdrs }) {
  const [data, setData] = useState(null);
  const [mese, setMese] = useState(null); // null = mese in corso (riparte ogni 1° del mese)

  useEffect(() => {
    setData(null);
    api.get("/admin/traffic", { ...hdrs(), params: mese ? { mese } : {} })
      .then((r) => setData(r.data))
      .catch((err) => toast.error(formatApiError(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- si ricarica solo cambiando mese
  }, [mese]);

  if (!data) return <div className="text-muted-foreground">Caricamento…</div>;

  const archiviato = Boolean(mese);
  const kpi = [
    ...(archiviato ? [] : [
      { icon: Users, label: "Visitatori unici oggi", value: data.today.visitors, color: "text-ciano" },
      { icon: Eye, label: "Aperture app oggi", value: data.today.opens, color: "text-fucsia" },
    ]),
    { icon: BarChart3, label: `Pagine viste (${data.etichetta})`, value: data.totals_mese.pageviews, color: "text-gold" },
    { icon: MousePointerClick, label: `Aperture (${data.etichetta})`, value: data.totals_mese.opens, color: "text-emerald-700" },
  ];

  return (
    <div data-testid="admin-traffic" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 data-testid="traffic-mese" className="font-serif text-2xl text-foreground">
          {archiviato ? `Archivio: ${data.etichetta}` : `Mese in corso: ${data.etichetta}`}
        </h3>
        <ArchivioMesi archivio={data.archivio} mese={mese} onScegli={setMese} testid="traffic-archivio" />
      </div>
      {!archiviato && (
        <p className="-mt-3 text-xs text-muted-foreground">I numeri ripartono da zero ogni 1° del mese; i mesi passati restano nell'archivio.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((c) => (
          <Card key={c.label} className="border-border bg-muted p-5">
            <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${c.color}`}>
              <c.icon size={14} /> {c.label}
            </div>
            <div className="mt-2 font-serif text-4xl text-foreground">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-ciano">Visitatori unici — giorno per giorno</div>
          <div className="mt-4"><Bars days={data.days} values={data.series.visitors} color="bg-ciano" /></div>
        </Card>
        <Card className="border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-fucsia">Aperture app — giorno per giorno</div>
          <div className="mt-4"><Bars days={data.days} values={data.series.opens} color="bg-fucsia" /></div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-gold">Pagine più viste ({data.etichetta})</div>
          <div className="mt-3 space-y-1.5">
            {data.top_pages.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground font-mono text-xs">{p.path}</span>
                <span className="ml-3 font-bold text-foreground">{p.count}</span>
              </div>
            ))}
            {data.top_pages.length === 0 && <div className="text-sm text-muted-foreground">Ancora nessun dato.</div>}
          </div>
        </Card>
        <Card className="border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-emerald-700">Click chiave ({data.etichetta})</div>
          <div className="mt-3 space-y-1.5">
            {data.clicks.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{CLICK_LABELS[c.name] || c.name}</span>
                <span className="ml-3 font-bold text-foreground">{c.count}</span>
              </div>
            ))}
            {data.clicks.length === 0 && <div className="text-sm text-muted-foreground">Ancora nessun click tracciato.</div>}
          </div>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Analytics first-party anonima: ID visitatore casuale non collegato agli account, nessun dato personale,
        nessun servizio esterno — coerente con la Cookie Policy.
      </p>
    </div>
  );
}
