import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

/** Fase di lancio: i numeri che contano adesso, in una pagina. */
export default function AdminLaunch({ hdrs }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    api.get("/admin/launch-summary", hdrs()).then((r) => setD(r.data)).catch((e) => toast.error(formatApiError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caricamento una volta all'apertura della scheda
  }, []);
  if (!d) return <p className="text-muted-foreground">Caricamento…</p>;
  return (
    <div data-testid="admin-launch" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Box label="Clienti iscritti" valore={d.clienti} nota={`+${d.clienti_ultimi_7_giorni} negli ultimi 7 giorni`} testid="lancio-clienti" />
        <Box label="Commercianti" valore={d.commercianti} nota={`+${d.commercianti_ultimi_7_giorni} negli ultimi 7 giorni`} testid="lancio-commercianti" />
        <Box label="Offerte da approvare" valore={d.offerte_da_approvare} nota="del mese e del mese prossimo" testid="lancio-da-approvare" evidenzia={d.offerte_da_approvare > 0} />
        <Box label={`Sconti usati a ${d.mese}`} valore={d.utilizzi_mese} testid="lancio-utilizzi" />
      </div>
      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">Negozi per quartiere</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {d.zone.map((z) => (
            <div key={z.zona} className="rounded-xl border border-border bg-muted p-3">
              <div className="text-sm font-semibold text-foreground">{z.zona}</div>
              <div className="text-xs text-muted-foreground">{z.negozi} iscritti · <span className="text-emerald-700">{z.online} con offerta online</span></div>
            </div>
          ))}
          {d.zone.length === 0 && <p className="text-sm text-muted-foreground">Nessun commerciante ancora.</p>}
        </div>
        {d.sospesi > 0 && <p className="mt-3 text-xs text-red-700">{d.sospesi} negozi sospesi.</p>}
      </Card>
      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">Negozi senza offerta ({d.negozi_senza_offerta.length})</h3>
        <p className="mt-1 text-xs text-muted-foreground">Iscritti che non hanno ancora caricato un'offerta: sono quelli da contattare.</p>
        <ul data-testid="lancio-senza-offerta" className="mt-2 list-disc pl-5 text-sm text-foreground/80">
          {d.negozi_senza_offerta.map((n) => <li key={n}>{n}</li>)}
          {d.negozi_senza_offerta.length === 0 && <li className="list-none text-muted-foreground">Tutti hanno un'offerta.</li>}
        </ul>
      </Card>
    </div>
  );
}

function Box({ label, valore, nota, testid, evidenzia }) {
  return (
    <Card className={`p-4 ${evidenzia ? "border-amber-400/50 bg-amber-400/10" : "border-border bg-muted"}`}>
      <div data-testid={testid} className="font-serif text-4xl text-foreground">{valore}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {nota && <div className="mt-1 text-[11px] text-muted-foreground">{nota}</div>}
    </Card>
  );
}
