import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { ArchivioMesi } from "@/components/admin/AdminTraffic";

/** Iscrizioni (clienti e negozi) per fonte di campagna (?fonte=…) del mese in corso, che riparte ogni 1° del mese;
 *  i mesi passati si scelgono dall'archivio. Solo numeri, nessun dato personale (decisione del titolare del 02/11). */
export default function IscrizioniPerFonte({ hdrs, testid = "iscrizioni-per-fonte" }) {
  const [dati, setDati] = useState(null);
  const [mese, setMese] = useState(null);
  useEffect(() => {
    setDati(null);
    api.get("/admin/iscrizioni-per-fonte", { ...(hdrs ? hdrs() : {}), params: mese ? { mese } : {} })
      .then((r) => setDati(r.data)).catch(() => setDati({ fonti: [], archivio: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hdrs cambia a ogni render
  }, [mese]);
  return (
    <Card className="border-border bg-muted p-5" data-testid={testid}>
      <h3 className="font-serif text-xl text-foreground">
        Iscrizioni per fonte{dati?.etichetta ? ` — ${mese ? "archivio " : ""}${dati.etichetta}` : ""}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Da volantino, social e altri link con «?fonte=». Ripartono da zero ogni 1° del mese. Solo numeri.
      </p>
      <div className="mt-2"><ArchivioMesi archivio={dati?.archivio} mese={mese} onScegli={setMese} testid={`${testid}-archivio`} /></div>
      {!dati ? (
        <p className="mt-2 text-sm text-muted-foreground">Caricamento…</p>
      ) : dati.fonti.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground" data-testid={`${testid}-vuoto`}>Nessuna iscrizione con una fonte in questo mese.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-semibold">Fonte</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">Clienti iscritti</th>
                <th scope="col" className="py-2 text-right font-semibold">Negozi iscritti</th>
              </tr>
            </thead>
            <tbody>
              {dati.fonti.map((f) => (
                <tr key={f.fonte} data-testid={`fonte-${f.fonte}`} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3 font-semibold">{f.fonte}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{f.clienti}</td>
                  <td className="py-2 text-right tabular-nums">{f.negozi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
