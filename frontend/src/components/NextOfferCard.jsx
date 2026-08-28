import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Clock, CheckCircle2, XCircle, CalendarClock } from "lucide-react";

/** Card "Offerta mese prossimo" per la MerchantDashboard. */
export const NextOfferCard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/merchants/me/next-discount").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return null;
  const { next_discount: nd, window: win } = data;
  const label = win?.next_month_label || "il mese prossimo";

  const statusBadge = () => {
    if (!nd) return null;
    if (nd.approval_status === "approved")
      return <span className="inline-flex items-center gap-1 rounded-full bg-fucsia/15 border border-fucsia/40 px-3 py-1 text-xs font-semibold text-fucsia"><CheckCircle2 size={12} /> Approvata — attiva dal 1°</span>;
    if (nd.approval_status === "rejected")
      return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive"><XCircle size={12} /> Rifiutata — da modificare</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-neon/15 border border-neon/40 px-3 py-1 text-xs font-semibold text-neon"><Clock size={12} /> In revisione</span>;
  };

  return (
    <Card data-testid="next-offer-card" className="border-ciano/30 bg-[#101418] border p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ciano">
            <CalendarPlus size={14} /> Offerta mese prossimo · {label}
          </div>
          {nd ? (
            <div className="mt-2">
              <div className="font-serif text-xl text-white">{nd.title}</div>
              <div className="mt-2">{statusBadge()}</div>
            </div>
          ) : win?.open ? (
            <p className="mt-2 text-sm text-white/70">
              La finestra è <strong className="text-ciano">aperta</strong>: carica ora l'offerta di {label}. Se non la carichi, dal 1° il negozio resterà senza offerta attiva.
            </p>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
              <CalendarClock size={14} className="text-gold" />
              La finestra di caricamento apre il <strong className="text-gold">{win?.opens_on}</strong> (ultimi 7 giorni del mese).
            </p>
          )}
        </div>
        <Link to="/merchant/discount?tab=next">
          <Button
            data-testid="next-offer-cta"
            className={nd || !win?.open ? "rounded-full border-white/20" : "rounded-full bg-ciano text-black hover:bg-ciano/90"}
            variant={nd || !win?.open ? "outline" : "default"}
          >
            {nd ? "Modifica offerta" : win?.open ? `Carica offerta di ${label}` : "Vedi dettagli"}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default NextOfferCard;
