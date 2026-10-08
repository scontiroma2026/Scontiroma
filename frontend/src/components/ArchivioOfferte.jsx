import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { Archive } from "lucide-react";
import { Pillola, Scheda, Scheletro, StatoVuoto, ErroreRiprova } from "@/components/AreaUI";

const TONO_STATO = { Scaduta: "viola", Rifiutata: "rosso", Ritirata: "ambra", Eliminata: "rosso" };
const nomeMese = (m) => {
  if (!m) return "";
  const [a, mm] = m.split("-").map(Number);
  return new Date(a, mm - 1, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
};

/** Le offerte passate del commerciante, con «Riusa» che le copia nel modulo del mese prossimo. */
export default function ArchivioOfferte({ onRiusa, finestraAperta, monthLabel }) {
  const [voci, setVoci] = useState(null);
  const [errore, setErrore] = useState(false);

  const carica = useCallback(() => {
    setErrore(false);
    setVoci(null);
    api.get("/merchants/me/archive").then((r) => setVoci(r.data.archivio || [])).catch(() => { setVoci([]); setErrore(true); });
  }, []);
  useEffect(() => { carica(); }, [carica]);

  if (voci === null) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Caricamento dell'archivio">
        <Scheletro className="h-5 w-full" />
        <Scheletro className="h-28 w-full" />
        <Scheletro className="h-28 w-full" />
      </div>
    );
  }
  return (
    <div data-testid="archivio-offerte" className="space-y-4">
      <p className="text-sm leading-relaxed text-ac-soft">
        Le tue offerte passate. «Riusa» la copia nell'offerta di {monthLabel}: la puoi cambiare prima di inviarla.
        {!finestraAperta && " Potrai riusarle quando si apre il caricamento dell'offerta del mese prossimo (ultimi 7 giorni del mese)."}
      </p>
      {errore && <ErroreRiprova onRiprova={carica}>Non riusciamo a caricare l'archivio. Riprova tra un attimo.</ErroreRiprova>}
      {!errore && voci.length === 0 && (
        <StatoVuoto icona={<Archive size={22} />} tono="viola">Non hai ancora offerte passate.</StatoVuoto>
      )}
      {voci.map((v) => (
        <Scheda key={v.archivio_id} data-testid={`archivio-${v.archivio_id}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="break-words font-serif text-xl font-bold leading-tight">{v.title}</div>
              <div className="mt-1 text-sm text-ac-soft">
                {[
                  nomeMese(v.mese),
                  v.discounted_price != null && `€${Number(v.discounted_price).toFixed(2)} invece di €${Number(v.original_price).toFixed(2)}`,
                  v.utilizzi > 0 && `usata da ${v.utilizzi} ${v.utilizzi === 1 ? "cliente" : "clienti"}`,
                ].filter(Boolean).join(" · ")}
              </div>
              {v.nota && <div className="mt-1 text-sm font-semibold text-ac-rosso">Motivo del rifiuto: {v.nota}</div>}
            </div>
            <Pillola tono={TONO_STATO[v.stato] || "viola"}>{v.stato}</Pillola>
          </div>
          <button
            type="button"
            data-testid={`riusa-${v.archivio_id}`}
            disabled={!finestraAperta}
            onClick={() => onRiusa(v.archivio_id)}
            className="ac-grad mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-extrabold text-white transition hover:brightness-105 disabled:opacity-45 sm:w-auto"
          >
            {v.stato === "Rifiutata" ? "Correggi e riusa" : "Riusa per il mese prossimo"}
          </button>
        </Scheda>
      ))}
    </div>
  );
}
