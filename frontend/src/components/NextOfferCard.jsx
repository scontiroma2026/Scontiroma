import { Link } from "react-router-dom";
import { CalendarPlus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Scheda, Pillola, CLASSE_BASE_SECONDARIO, CLASSE_BORDO, CLASSE_PRIMARIO } from "@/components/AreaUI";
import { dataIt } from "@/lib/durata";

/**
 * Card «Prossima offerta» per la MerchantDashboard: l'offerta che andrà online quando finisce quella di adesso.
 * `data` è la risposta di /merchants/me/next-discount (la carica la dashboard, che la usa anche per «Da fare»).
 * Compare solo con un'offerta online: senza, il negozio usa il modulo normale («La tua offerta»).
 */
export const NextOfferCard = ({ data }) => {
  if (!data) return null;
  const { next_discount: nd, window: win, no_renew: noRenew } = data;
  if (!win?.open && !nd) return null;
  const parteIl = win?.starts_on ? dataIt(win.starts_on) : "";
  const quando = parteIl ? `il ${parteIl}` : "appena approvata";

  const statusBadge = () => {
    if (!nd) return null;
    if (nd.approval_status === "approved")
      return <Pillola tono="verde"><CheckCircle2 size={14} aria-hidden="true" /> Approvata — online {parteIl ? `dal ${parteIl}` : "a breve"}</Pillola>;
    if (nd.approval_status === "rejected")
      return <Pillola tono="rosso"><XCircle size={14} aria-hidden="true" /> Rifiutata — da modificare</Pillola>;
    return <Pillola tono="ambra"><Clock size={14} aria-hidden="true" /> In revisione</Pillola>;
  };

  const primario = !nd && win?.days_left != null && win.days_left <= 7;

  return (
    <Scheda
      data-testid="next-offer-card"
      titolo="Prossima offerta"
      tono="teal"
      icona={<CalendarPlus size={15} />}
    >
      {nd ? (
        <div>
          <div className="font-serif text-xl leading-tight">{nd.title}</div>
          <div className="mt-2">{statusBadge()}</div>
        </div>
      ) : noRenew ? (
        <p data-testid="next-offer-no-renew" className="text-sm leading-relaxed text-ac-soft">
          Hai scelto di <strong className="text-ac-ink">non rinnovare</strong>: non serve preparare la prossima offerta. Se cambi idea, annulla la scelta dal riquadro in alto.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-ac-soft">
          Puoi prepararla <strong className="text-ac-teal">quando vuoi</strong>: andrà online {quando}{parteIl ? ", quando finisce quella di adesso" : ""}. Se non la prepari e non prolunghi, alla scadenza il negozio resta senza offerta.
        </p>
      )}
      {noRenew && !nd ? (
        <span
          data-testid="next-offer-cta"
          aria-disabled="true"
          className="mt-4 inline-flex min-h-[46px] w-full cursor-not-allowed items-center justify-center rounded-2xl bg-ac-tint px-5 text-sm font-extrabold text-ac-soft"
        >
          Prepara la prossima offerta
        </span>
      ) : (
      <Link
        to="/merchant/discount?tab=next"
        data-testid="next-offer-cta"
        className={`mt-4 w-full ${primario ? CLASSE_PRIMARIO : `${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.teal} min-h-[46px]`}`}
      >
        {nd ? "Modifica la prossima offerta" : "Prepara la prossima offerta"}
      </Link>
      )}
    </Scheda>
  );
};

export default NextOfferCard;
