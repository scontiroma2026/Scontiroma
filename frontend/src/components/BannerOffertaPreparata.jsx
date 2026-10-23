import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Check, Pencil } from "lucide-react";
import api, { formatApiError } from "@/lib/api";

// Stesso testo che il server registra come versione della conferma (CPN_TESTO_CONFERMA in server.py).
export const TESTO_RESPONSABILITA =
  "Confermando dichiari che i dati dell'offerta sono corretti e te ne assumi la responsabilità, come se l'avessi inserita tu.";

/**
 * «Ci pensiamo noi»: l'offerta è stata preparata da Sconti Roma e aspetta la conferma del negozio.
 * «Confermo» la manda in revisione; «Modificala» apre il modulo (salvando, va in revisione come sua).
 * `conModifica`: mostra il link al modulo (nella pagina del modulo non serve).
 */
export default function BannerOffertaPreparata({ onConfermata, conModifica = true }) {
  const [busy, setBusy] = useState(false);
  const conferma = async () => {
    if (!window.confirm(`Confermi l'offerta preparata da Sconti Roma?\n\n${TESTO_RESPONSABILITA}`)) return;
    setBusy(true);
    try {
      await api.post("/merchants/me/discount/conferma-preparata");
      toast.success("Offerta confermata: ora è in revisione.");
      onConfermata?.();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setBusy(false); }
  };
  return (
    <div data-testid="banner-preparata" className="mb-4 rounded-2xl border-2 border-ac-teal/40 bg-ac-tealBg p-4 text-ac-ink">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-ac-teal" aria-hidden="true"><Sparkles size={20} /></span>
        <div className="min-w-0">
          <div className="font-serif text-xl font-bold leading-tight">Preparata da Sconti Roma: confermala o modificala</div>
          <p className="mt-1 text-sm leading-relaxed text-ac-soft">
            Abbiamo inserito noi la tua offerta, gratuitamente. Non è ancora visibile ai clienti: lo diventa dopo la tua conferma e il nostro controllo.
          </p>
          <p className="mt-2 rounded-xl border border-ac-ambra/40 bg-white p-3 text-sm text-ac-ink">{TESTO_RESPONSABILITA}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" data-testid="preparata-confermo" onClick={conferma} disabled={busy}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ac-teal px-5 text-sm font-extrabold text-white disabled:opacity-60">
              <Check size={18} aria-hidden="true" /> {busy ? "Conferma in corso…" : "Confermo"}
            </button>
            {conModifica && (
              <Link to="/merchant/discount" data-testid="preparata-modifica"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ac-teal bg-white px-5 text-sm font-extrabold text-ac-ink">
                <Pencil size={16} aria-hidden="true" /> Voglio modificarla
              </Link>
            )}
          </div>
          {!conModifica && (
            <p className="mt-2 text-xs text-ac-soft">Per modificarla cambia i campi qui sotto e tocca «Salva le mie modifiche»: va in revisione come offerta tua.</p>
          )}
        </div>
      </div>
    </div>
  );
}
