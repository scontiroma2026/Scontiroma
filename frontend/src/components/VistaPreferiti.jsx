import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import DiscountCard from "@/components/DiscountCard";
import { Button } from "@/components/ui/button";
import { usePreferiti } from "@/context/PreferitiContext";

/** Le offerte dei negozi preferiti del cliente, con l'avviso via email (solo se lo chiede). */
export default function VistaPreferiti() {
  const { ids, avvisi, impostaAvvisi, ricarica } = usePreferiti();
  const [offerte, setOfferte] = useState(null);
  const [chiusoBanner, setChiusoBanner] = useState(false);

  useEffect(() => {
    ricarica().then((d) => setOfferte(d?.offerte || []));
  }, [ricarica]);

  // Un cuore tolto qui fa sparire subito l'offerta dalla vista
  const visibili = (offerte || []).filter((d) => ids.includes(d.merchant?.id));
  const senzaOfferta = ids.length - new Set(visibili.map((d) => d.merchant?.id)).size;

  return (
    <div data-testid="vista-preferiti">
      {!avvisi && !chiusoBanner && ids.length > 0 && (
        <div data-testid="avvisi-banner" className="mb-6 flex flex-wrap items-start gap-3 rounded-2xl border border-ciano/30 bg-ciano/10 p-4">
          <Bell className="mt-0.5 shrink-0 text-ciano" size={20} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">Vuoi un'email quando i tuoi negozi preferiti pubblicano l'offerta del mese? Al massimo una per negozio al mese.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button data-testid="avvisi-si" onClick={() => impostaAvvisi(true)} className="bg-ciano text-white hover:bg-ciano/90">Sì, avvisami</Button>
              <Button variant="outline" onClick={() => setChiusoBanner(true)} className="border-border text-foreground hover:bg-muted">No grazie</Button>
            </div>
          </div>
        </div>
      )}
      {avvisi && (
        <div data-testid="avvisi-attivi" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted p-4 text-sm text-foreground/80">
          <span className="flex items-center gap-2"><Bell size={16} className="text-ciano" /> Ti avvisiamo via email quando un tuo negozio preferito pubblica l'offerta.</span>
          <button type="button" data-testid="avvisi-no" onClick={() => impostaAvvisi(false)} className="text-ciano underline underline-offset-2">Non avvisarmi più</button>
        </div>
      )}

      {offerte === null ? (
        <p className="text-muted-foreground">Caricamento…</p>
      ) : ids.length === 0 ? (
        <div data-testid="preferiti-vuoti" className="rounded-xl border border-border bg-muted p-10 text-center text-muted-foreground">
          Non hai ancora negozi preferiti. Tocca il cuore su un'offerta per salvarla qui.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibili.map((d) => <DiscountCard key={d.id} discount={d} />)}
          </div>
          {senzaOfferta > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              {senzaOfferta === 1 ? "1 negozio preferito non ha" : `${senzaOfferta} negozi preferiti non hanno`} un'offerta in questo momento.
            </p>
          )}
        </>
      )}
    </div>
  );
}
