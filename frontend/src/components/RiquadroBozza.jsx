import { FileClock } from "lucide-react";

/** Riquadro «Hai una bozza non salvata» con «Riprendi» e «Scarta» (aree toccabili da 44 px). */
export default function RiquadroBozza({ fotoPerse, onRiprendi, onScarta, testid = "bozza-riquadro" }) {
  return (
    <div data-testid={testid} role="region" aria-label="Bozza non salvata" className="mb-4 rounded-2xl border border-ac-teal/40 bg-ac-violaBg p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-ac-teal" aria-hidden="true"><FileClock size={20} /></span>
        <div className="min-w-0">
          <div className="font-serif text-xl font-bold leading-tight text-ac-ink">Hai una bozza non salvata</div>
          <p className="mt-1 text-sm leading-relaxed text-ac-soft">
            Quello che avevi scritto è rimasto su questo telefono. Vuoi riprenderlo?
          </p>
          {fotoPerse && (
            <p data-testid="bozza-foto-avviso" className="mt-1 text-sm font-semibold leading-relaxed text-ac-ink">
              Le foto vanno aggiunte di nuovo.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" data-testid="bozza-riprendi" onClick={onRiprendi}
              className="inline-flex min-h-11 items-center rounded-full bg-ac-viola px-5 text-sm font-extrabold text-ac-mieleInk">
              Riprendi
            </button>
            <button type="button" data-testid="bozza-scarta" onClick={onScarta}
              className="inline-flex min-h-11 items-center rounded-full border-2 border-ac-campo bg-white px-5 text-sm font-extrabold text-ac-ink">
              Scarta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
