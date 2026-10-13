import { useState } from "react";
import { Scheda } from "@/components/AreaUI";
import SegnalaForm from "@/components/SegnalaForm";

const TIPI = [{ valore: "reclamo_commerciante", etichetta: "Reclamo (sospensione, offerta rimossa, altro)" }];

/** Reclami dei commercianti: arrivano nell'area admin, conferma di ricezione entro 5 giorni lavorativi. */
export default function ReclamoCard() {
  const [aperto, setAperto] = useState(false);
  return (
    <Scheda titolo="Hai un reclamo?" tono="viola" className="mb-4" data-testid="reclamo-card">
      <p className="text-sm text-ac-soft">Se pensi che una decisione sul tuo negozio o sulla tua offerta non sia giusta, scrivici: ti confermiamo la ricezione entro 5 giorni lavorativi e ti rispondiamo con una motivazione.</p>
      {!aperto ? (
        <button type="button" onClick={() => setAperto(true)} data-testid="reclamo-apri"
          className="mt-3 inline-flex min-h-12 items-center rounded-xl border-2 border-ac-soft bg-white px-4 text-sm font-extrabold text-ac-ink hover:bg-ac-tint">
          Invia un reclamo
        </button>
      ) : (
        <div className="mt-3"><SegnalaForm endpoint="/merchants/me/reclami" tipi={TIPI} conEmail={false} onDone={() => setAperto(false)} testId="reclamo-form" /></div>
      )}
    </Scheda>
  );
}
