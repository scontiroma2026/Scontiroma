import { Clock } from "lucide-react";

// «Ci pensiamo noi» (decisione del titolare del 18/10): per chi ha poco tempo l'offerta la inseriamo noi,
// gratuitamente; il negozio la controlla e la conferma dall'email. Testi secondo la skill comunicazione-marchio.
export const WHATSAPP_NUMERO = "352 247 3526";
export const WHATSAPP_LINK = `https://wa.me/39${WHATSAPP_NUMERO.replace(/\s/g, "")}?text=${encodeURIComponent("Ciao, vorrei che inseriste voi l'offerta del mio negozio su Sconti Roma.")}`;
export const EMAIL_INFO = "info@scontiroma.it";

export default function RiquadroCiPensiamoNoi({ testid = "ci-pensiamo-noi", className = "" }) {
  return (
    <section data-testid={testid} aria-labelledby={`${testid}-titolo`}
      className={`rounded-2xl border-2 border-ac-teal/40 bg-ac-tealBg p-5 text-left text-ac-ink ${className}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-ac-teal" aria-hidden="true"><Clock size={24} /></span>
        <div className="min-w-0">
          <h2 id={`${testid}-titolo`} className="font-serif text-2xl font-bold leading-tight">Non hai tempo? Ci pensiamo noi.</h2>
          <p className="mt-2 text-sm leading-relaxed text-ac-soft">
            Dicci cosa vuoi offrire: l'offerta la inseriamo noi per te, ed è un servizio <strong className="text-ac-ink">gratuito</strong>.
            Ti mandiamo un'email con il riepilogo: la controlli e la confermi con un tocco, oppure la modifichi.
            Diventa visibile solo dopo la tua conferma.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a data-testid={`${testid}-whatsapp`} href={WHATSAPP_LINK} target="_blank" rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-5 text-sm font-extrabold text-white hover:bg-emerald-800">
              Scrivici su WhatsApp: {WHATSAPP_NUMERO}
            </a>
            <a data-testid={`${testid}-email`} href={`mailto:${EMAIL_INFO}?subject=${encodeURIComponent("Ci pensiamo noi")}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ac-teal bg-white px-5 text-sm font-extrabold text-ac-ink hover:bg-ac-tint">
              {EMAIL_INFO}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
