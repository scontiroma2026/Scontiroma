import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { CalendarPlus, CheckCircle2, XCircle, Clock, CalendarClock } from "lucide-react";
import { Scheda, Pillola, CLASSE_BASE_SECONDARIO, CLASSE_BORDO, CLASSE_PRIMARIO } from "@/components/AreaUI";

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
      return <Pillola tono="verde"><CheckCircle2 size={14} aria-hidden="true" /> Approvata — attiva dal 1°</Pillola>;
    if (nd.approval_status === "rejected")
      return <Pillola tono="rosso"><XCircle size={14} aria-hidden="true" /> Rifiutata — da modificare</Pillola>;
    return <Pillola tono="ambra"><Clock size={14} aria-hidden="true" /> In revisione</Pillola>;
  };

  const primario = !nd && win?.open;

  return (
    <Scheda
      data-testid="next-offer-card"
      titolo={`Offerta mese prossimo · ${label}`}
      tono="teal"
      icona={<CalendarPlus size={15} />}
    >
      {nd ? (
        <div>
          <div className="font-serif text-xl leading-tight">{nd.title}</div>
          <div className="mt-2">{statusBadge()}</div>
        </div>
      ) : win?.open ? (
        <p className="text-sm leading-relaxed text-ac-soft">
          La finestra è <strong className="text-ac-teal">aperta</strong>: carica ora l'offerta di {label}. Se non la carichi, dal 1° il negozio resterà senza offerta attiva.
        </p>
      ) : (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-ac-soft">
          <CalendarClock size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ac-teal" />
          <span>La finestra di caricamento apre il <strong className="text-ac-ink">{win?.opens_on}</strong> (ultimi 7 giorni del mese).</span>
        </p>
      )}
      <Link
        to="/merchant/discount?tab=next"
        data-testid="next-offer-cta"
        className={`mt-4 w-full ${primario ? CLASSE_PRIMARIO : `${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.teal} min-h-[46px]`}`}
      >
        {nd ? "Modifica offerta" : win?.open ? `Carica offerta di ${label}` : "Vedi dettagli"}
      </Link>
    </Scheda>
  );
};

export default NextOfferCard;
