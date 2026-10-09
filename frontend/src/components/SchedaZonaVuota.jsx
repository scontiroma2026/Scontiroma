import { useState } from "react";
import api from "@/lib/api";
import { MapPin, Check } from "lucide-react";

// Un voto per zona e per browser. Si salva solo l'elenco delle zone già votate, sul telefono del cliente.
const CHIAVE = "sr_interesse_zona";

function zoneVotate() {
  try {
    const v = JSON.parse(localStorage.getItem(CHIAVE) || "[]");
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function ricordaVoto(zona) {
  try { localStorage.setItem(CHIAVE, JSON.stringify([...new Set([...zoneVotate(), zona])])); } catch (e) { /* senza memoria locale: il limite per IP resta */ }
}

/** Zona senza offerte: scheda chiara. Il voto è solo un contatore per zona: nessuna email né dato personale. */
export default function SchedaZonaVuota({ zona, onAltreZone }) {
  const [votato, setVotato] = useState(() => zoneVotate().includes(zona));
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");

  const vota = async () => {
    setInvio(true); setErrore("");
    try {
      await api.post("/interesse-zona", { zona });
      ricordaVoto(zona);
      setVotato(true);
    } catch (e) {
      setErrore("Non siamo riusciti a registrare la richiesta. Riprova tra poco.");
    } finally { setInvio(false); }
  };

  return (
    <section data-testid="scheda-zona-vuota" aria-labelledby="scheda-zona-titolo"
      className="mb-8 rounded-2xl border border-border bg-muted p-6 text-center sm:p-10">
      <MapPin size={28} className="mx-auto text-fucsia" aria-hidden="true" />
      <h2 id="scheda-zona-titolo" className="mt-3 font-serif text-3xl text-foreground">Stiamo arrivando nella tua zona</h2>
      <p className="mx-auto mt-3 max-w-md text-foreground/80">
        Qui non ci sono ancora offerte. Stiamo cercando i primi negozi: torna a trovarci presto.
      </p>
      {votato && (
        <p data-testid="interesse-grazie" role="status"
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-sm font-semibold text-emerald-800">
          <Check size={18} aria-hidden="true" /> Grazie! Abbiamo segnato il tuo interesse per questa zona.
        </p>
      )}
      {errore && <p role="alert" className="mt-4 text-sm text-red-700">{errore}</p>}
      <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <button type="button" data-testid="scheda-altre-zone" onClick={onAltreZone}
          className="inline-flex h-11 items-center justify-center rounded-full bg-fucsia px-5 text-sm font-semibold text-white">
          Vedi le offerte nelle altre zone
        </button>
        {!votato && (
          <button type="button" data-testid="scheda-interesse" onClick={vota} disabled={invio}
            className="inline-flex h-11 items-center justify-center rounded-full border border-input px-5 text-sm font-semibold text-foreground disabled:opacity-60">
            {invio ? "Un momento…" : "Fammi sapere quando arrivate"}
          </button>
        )}
      </div>
    </section>
  );
}
