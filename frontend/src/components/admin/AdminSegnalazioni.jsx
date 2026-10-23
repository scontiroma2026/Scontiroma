import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TIPI = { contenuto_illecito: "Contenuto illecito", offerta_non_rispettata: "Sconto non rispettato", reclamo_commerciante: "Reclamo commerciante", altro: "Altro" };

/** Segnalazioni del pubblico e reclami dei commercianti: conferma entro 5 giorni lavorativi, esito sempre motivato. */
export default function AdminSegnalazioni({ hdrs }) {
  const [dati, setDati] = useState(null);
  const carica = useCallback(() => {
    api.get("/admin/segnalazioni", hdrs()).then((r) => setDati(r.data)).catch((e) => toast.error(formatApiError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { carica(); }, [carica]);

  const esito = async (s, stato) => {
    let motivazione = "";
    if (stato !== "in_esame") {
      motivazione = window.prompt(`Motivazione dell'esito «${stato}» (la riceve chi ha segnalato, se ha lasciato l'email):`, "") || "";
      if (motivazione.trim().length < 10) { toast.error("Serve una motivazione di almeno 10 caratteri"); return; }
    }
    try {
      await api.post(`/admin/segnalazioni/${s.id}/esito`, { stato, motivazione }, hdrs());
      toast.success("Esito salvato");
      carica();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!dati) return <p className="text-muted-foreground">Caricamento…</p>;
  return (
    <Card className="border-border bg-muted p-6" data-testid="admin-segnalazioni">
      <h3 className="font-serif text-2xl">Segnalazioni e reclami</h3>
      <p className="mt-1 text-xs text-muted-foreground">Da gestire: {dati.da_gestire}. Conferma entro 5 giorni lavorativi; ogni esito va motivato.</p>
      {dati.segnalazioni.length === 0 && <p className="mt-6 text-sm text-muted-foreground">Nessuna segnalazione.</p>}
      <ul className="mt-4 space-y-3">
        {dati.segnalazioni.map((s) => (
          <li key={s.id} data-testid={`segnalazione-${s.id}`} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-border px-2 py-0.5 font-semibold">{TIPI[s.tipo] || s.tipo}</span>
              <span className="text-muted-foreground">{new Date(s.creata_il).toLocaleString("it-IT")}</span>
              <span className="font-semibold">Stato: {s.stato}</span>
              <span className="text-muted-foreground">Rispondere entro {s.conferma_entro}</span>
              {s.sospensione && s.riesame_entro && (
                <span data-testid={`segnalazione-riesame-${s.id}`} className="rounded-full border border-red-500/40 px-2 py-0.5 font-semibold text-red-700">
                  Contesta una sospensione: riesame entro il {new Date(s.riesame_entro + "T12:00:00").toLocaleDateString("it-IT")}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm font-semibold">{s.riferimento}</div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{s.motivo}</p>
            {s.email && <p className="mt-1 text-xs text-muted-foreground">Contatto: {s.email}</p>}
            {s.motivazione && <p className="mt-2 text-xs"><strong>Motivazione:</strong> {s.motivazione}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => esito(s, "in_esame")}>In esame</Button>
              <Button size="sm" onClick={() => esito(s, "accolta")}>Accolta</Button>
              <Button size="sm" variant="outline" onClick={() => esito(s, "respinta")}>Respinta</Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
