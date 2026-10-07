import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { GIORNI } from "@/components/MerchantHours";

/** Orari scritti dal commerciante, sulla pagina dell'offerta. Non compare se non li ha inseriti. */
export default function OrariNegozio({ orari, stato }) {
  const [aperto, setAperto] = useState(false);
  if (!orari || !stato) return null;
  const colore = stato.aperto ? "text-green-400" : "text-white/80";
  return (
    <div data-testid="orari-negozio" className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
      <button type="button" onClick={() => setAperto((v) => !v)} aria-expanded={aperto}
        className="flex w-full items-center justify-between gap-3 text-left">
        <span data-testid="orari-negozio-stato" className={`flex items-center gap-2 text-sm font-semibold ${colore}`}>
          <Clock size={16} /> {stato.testo}
        </span>
        <span className="flex items-center gap-1 text-xs text-white/60">Orari <ChevronDown size={14} className={aperto ? "rotate-180" : ""} /></span>
      </button>
      {stato.nota && <p className="mt-2 text-sm text-white/70">{stato.nota}</p>}
      {aperto && (
        <dl data-testid="orari-negozio-settimana" className="mt-3 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-sm">
          {orari.giorni.map((g, i) => (
            <div key={GIORNI[i]} className="contents">
              <dt className="text-white/60">{GIORNI[i]}</dt>
              <dd className="text-white/90">{g.chiuso ? "Chiuso" : g.fasce.map((f) => `${f.apre}–${f.chiude}`).join(" · ")}</dd>
            </div>
          ))}
        </dl>
      )}
      {aperto && orari.aggiornati_il && (
        <p className="mt-2 text-xs text-white/50">
          Orari indicati dal negozio · aggiornati il {new Date(orari.aggiornati_il).toLocaleDateString("it-IT")}
        </p>
      )}
    </div>
  );
}
