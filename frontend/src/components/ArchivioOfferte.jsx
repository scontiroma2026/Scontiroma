import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COLORE = { Scaduta: "text-white/70 bg-white/10", Rifiutata: "text-red-300 bg-red-500/15", Ritirata: "text-yellow-200 bg-yellow-500/15", Eliminata: "text-red-300 bg-red-500/15" };
const nomeMese = (m) => {
  if (!m) return "";
  const [a, mm] = m.split("-").map(Number);
  return new Date(a, mm - 1, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
};

/** Le offerte passate del commerciante, con «Riusa» che le copia nel modulo del mese prossimo. */
export default function ArchivioOfferte({ onRiusa, finestraAperta, monthLabel }) {
  const [voci, setVoci] = useState(null);
  useEffect(() => {
    api.get("/merchants/me/archive").then((r) => setVoci(r.data.archivio || [])).catch(() => setVoci([]));
  }, []);

  if (voci === null) return <p className="text-white/60">Caricamento…</p>;
  return (
    <div data-testid="archivio-offerte" className="space-y-4">
      <p className="text-sm text-white/70">
        Le tue offerte passate. «Riusa» la copia nell'offerta di {monthLabel}: la puoi cambiare prima di inviarla.
        {!finestraAperta && " Potrai riusarle quando si apre il caricamento dell'offerta del mese prossimo (ultimi 7 giorni del mese)."}
      </p>
      {voci.length === 0 && (
        <Card className="border-white/10 bg-white/5 p-8 text-center text-white/70">Non hai ancora offerte passate.</Card>
      )}
      {voci.map((v) => (
        <Card key={v.archivio_id} data-testid={`archivio-${v.archivio_id}`} className="border-white/10 bg-[#141414] p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-serif text-xl text-white break-words">{v.title}</div>
              <div className="mt-1 text-sm text-white/60">
                {nomeMese(v.mese)}
                {v.discounted_price != null && ` · €${Number(v.discounted_price).toFixed(2)} invece di €${Number(v.original_price).toFixed(2)}`}
                {v.utilizzi > 0 && ` · usata da ${v.utilizzi} ${v.utilizzi === 1 ? "cliente" : "clienti"}`}
              </div>
              {v.nota && <div className="mt-1 text-sm text-red-300">Motivo del rifiuto: {v.nota}</div>}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${COLORE[v.stato] || COLORE.Scaduta}`}>{v.stato}</span>
          </div>
          <Button
            data-testid={`riusa-${v.archivio_id}`}
            disabled={!finestraAperta}
            onClick={() => onRiusa(v.archivio_id)}
            className="mt-4 bg-ciano text-black hover:bg-ciano/90"
          >
            {v.stato === "Rifiutata" ? "Correggi e riusa" : "Riusa per il mese prossimo"}
          </Button>
        </Card>
      ))}
    </div>
  );
}
