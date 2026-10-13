import { useState } from "react";
import { Flag } from "lucide-react";
import SegnalaForm from "@/components/SegnalaForm";

const TIPI = [
  { valore: "contenuto_illecito", etichetta: "Contenuto illecito o ingannevole" },
  { valore: "offerta_non_rispettata", etichetta: "Lo sconto non è stato rispettato" },
  { valore: "altro", etichetta: "Altro" },
];

/** «Segnala questa offerta»: apre il modulo sotto la scheda. Per chiunque, anche senza account. */
export default function SegnalaOfferta({ discountId }) {
  const [aperto, setAperto] = useState(false);
  return (
    <div className="mt-6 border-t border-border pt-4" data-testid="segnala-offerta">
      {!aperto ? (
        <button type="button" onClick={() => setAperto(true)} data-testid="segnala-apri"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          <Flag size={13} aria-hidden="true" /> Segnala questa offerta
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-muted p-4">
          <h3 className="mb-3 font-serif text-lg">Segnala questa offerta</h3>
          <SegnalaForm tipi={TIPI} discountId={discountId} onDone={() => setAperto(false)} />
        </div>
      )}
    </div>
  );
}
