import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TIPI = {
  guadagnato: "Sconticino dato",
  rifiutato_limite: "Rifiutato (limite giornaliero)",
  premio_sbloccato: "Premio sbloccato",
  premio_usato: "Premio riscattato",
  premio_scaduto: "Premio scaduto",
  config: "Impostazioni del negozio",
  admin_sospensione: "Sospensione admin",
};
const ora = (iso) => (iso ? new Date(iso).toLocaleString("it-IT") : "");

/** Scheda «Sconticini» (solo admin con master password): totali, un riga per negozio e tracciamento completo. */
export default function AdminSconticini({ hdrs }) {
  const [d, setD] = useState(null);
  const carica = useCallback(() => {
    api.get("/admin/sconticini", hdrs()).then((r) => setD(r.data)).catch((e) => toast.error(formatApiError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { carica(); }, [carica]);

  const sospendi = async (n) => {
    const nuovo = !n.sospeso_admin;
    if (!window.confirm(nuovo ? `Mettere in pausa gli Sconticini di ${n.shop_name}? I contatori e i premi già sbloccati restano.` : `Riattivare gli Sconticini di ${n.shop_name}?`)) return;
    try {
      await api.post(`/admin/sconticini/negozi/${n.merchant_id}/sospendi`, { sospeso: nuovo }, hdrs());
      carica();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!d) return <p className="text-muted-foreground">Caricamento…</p>;
  if (!d.enabled) return <Card className="border-border bg-muted p-6 text-sm text-muted-foreground">Gli Sconticini sono spenti (SCONTICINI_ENABLED). Nessun dato viene raccolto.</Card>;
  const t = d.totali;
  return (
    <div data-testid="admin-sconticini" className="space-y-6">
      <Card className="border-border bg-muted p-6">
        <h3 className="font-serif text-2xl">Sconticini</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["Sconticini dati", t.sconticini_assegnati], ["Premi sbloccati", t.premi_sbloccati], ["Riscattati", t.premi_riscattati],
            ["Scaduti", t.premi_scaduti], ["Da usare", t.premi_da_usare]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-card p-3 text-center"><div className="font-serif text-3xl">{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>
          ))}
        </div>
      </Card>

      <Card className="border-border bg-muted p-6">
        <h3 className="font-serif text-xl">Negozi ({d.negozi.length})</h3>
        <ul className="mt-3 divide-y divide-border">
          {d.negozi.map((n) => (
            <li key={n.merchant_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <div className="font-bold">{n.shop_name} {n.sospeso_admin ? "· in pausa (admin)" : n.attivo ? "" : "· spento"}</div>
                <div className="text-xs text-muted-foreground">
                  {n.soglia} sconticini → {n.premio} · dati {n.sconticini_assegnati} · sbloccati {n.premi_sbloccati} · riscattati {n.premi_riscattati} · scaduti {n.premi_scaduti}
                </div>
                <div className="text-xs text-muted-foreground">Regolamento {n.regolamento_versione || "non accettato"} {n.regolamento_accettato_il ? `(${ora(n.regolamento_accettato_il)})` : ""}</div>
              </div>
              <Button variant="outline" onClick={() => sospendi(n)} className="min-h-11">{n.sospeso_admin ? "Riattiva" : "Metti in pausa"}</Button>
            </li>
          ))}
          {d.negozi.length === 0 && <li className="py-3 text-muted-foreground">Nessun negozio ha ancora impostato gli Sconticini.</li>}
        </ul>
      </Card>

      <Card className="border-border bg-muted p-6">
        <h3 className="font-serif text-xl">Tracciamento (ultimi {d.eventi.length})</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground"><tr><th className="py-2">Quando</th><th>Cosa</th><th>Cliente</th><th>Negozio</th></tr></thead>
            <tbody>
              {d.eventi.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="py-2 pr-3 whitespace-nowrap">{ora(e.at)}</td>
                  <td className="pr-3">{TIPI[e.tipo] || e.tipo}</td>
                  <td className="pr-3">{e.client_name || "—"}</td>
                  <td>{e.shop_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
