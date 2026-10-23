import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { CheckCircle2, AlertCircle, Loader2, Check, Pencil } from "lucide-react";
import { WHATSAPP_LINK, WHATSAPP_NUMERO, EMAIL_INFO } from "@/components/RiquadroCiPensiamoNoi";

const euro = (v) => (typeof v === "number" ? `${v.toFixed(2).replace(".", ",")} €` : "");

/**
 * «Ci pensiamo noi»: pagina aperta dal pulsante «Confermo» dell'email (/conferma-offerta?token=…).
 * Senza login: mostra l'offerta preparata da Sconti Roma e la frase di responsabilità. La conferma parte
 * solo toccando «Confermo» qui (POST), non all'apertura del link: gli antivirus della posta aprono i link.
 */
export default function ConfermaOfferta() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [stato, setStato] = useState(token ? "carica" : "errore"); // carica | pronta | invio | ok | errore
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState({ code: "link_non_valido", msg: "" });

  useEffect(() => {
    if (!token) return undefined;
    let annullato = false;
    api.post("/ci-pensiamo-noi/anteprima", { token })
      .then(({ data }) => { if (!annullato) { setDati(data); setStato("pronta"); } })
      .catch((err) => {
        if (annullato) return;
        setErrore(err?.response?.data?.detail || { code: "link_non_valido", msg: "" });
        setStato("errore");
      });
    return () => { annullato = true; };
  }, [token]);

  const conferma = async () => {
    setStato("invio");
    try {
      await api.post("/ci-pensiamo-noi/conferma", { token });
      setStato("ok");
    } catch (err) {
      setErrore(err?.response?.data?.detail || { code: "link_non_valido", msg: "" });
      setStato("errore");
    }
  };

  const o = dati?.offerta;
  const usi = o?.max_uses_per_month || 1;
  const righe = o ? [
    ["Descrizione", o.description],
    ["Giorni e orari", o.validity_info],
    ["Utilizzi al mese", usi === 1 ? "1 volta per cliente" : `${usi} volte per cliente`],
    ["Condizioni", o.terms],
    ["Prenotazione", o.plan_ahead],
    ["Altre informazioni", o.additional_info],
  ].filter(([, v]) => v) : [];

  return (
    <main data-testid="conferma-offerta-page" className="mx-auto max-w-xl px-4 py-10 text-ac-ink sm:px-6">
      {stato === "carica" && (
        <div className="flex items-center gap-3" role="status">
          <Loader2 className="animate-spin" size={24} aria-hidden="true" /> Carico la tua offerta…
        </div>
      )}

      {(stato === "pronta" || stato === "invio") && o && (
        <div data-testid="conferma-offerta-anteprima">
          <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-ac-viola">Non hai tempo? Ci pensiamo noi.</div>
          <h1 className="mt-1.5 font-serif text-[30px] leading-[1.1]">Conferma l'offerta di {dati.negozio}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ac-soft">
            L'abbiamo inserita noi per te, gratuitamente. Non è ancora visibile ai clienti: lo diventa dopo la tua conferma e il nostro controllo.
          </p>

          <article className="mt-5 overflow-hidden rounded-2xl border border-ac-line bg-white">
            {o.image_urls?.length > 0 && (
              <div className="grid gap-1">
                {o.image_urls.map((u, i) => (
                  <img key={`${i}-${u.slice(0, 40)}`} src={u} alt={i === 0 ? "Foto di copertina dell'offerta" : `Foto ${i + 1} dell'offerta`}
                    className="aspect-video w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                ))}
              </div>
            )}
            <div className="p-4">
              <h2 className="break-words font-serif text-2xl leading-tight">{o.title}</h2>
              <div className="mt-1.5 flex items-baseline gap-2 text-base">
                <strong className="font-extrabold text-ac-rosa">{euro(o.discounted_price)}</strong>
                <span className="text-ac-mute line-through">{euro(o.original_price)}</span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {righe.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-bold">{k}</dt>
                    <dd className="whitespace-pre-line text-ac-soft">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>

          <p data-testid="conferma-offerta-responsabilita" className="mt-5 rounded-xl border-2 border-ac-ambra/50 bg-ac-ambraBg p-4 text-sm font-semibold">
            {dati.testo_conferma}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <button type="button" data-testid="conferma-offerta-confermo" onClick={conferma} disabled={stato === "invio"}
              className="ac-grad inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-base font-extrabold text-white disabled:opacity-60">
              <Check size={20} aria-hidden="true" /> {stato === "invio" ? "Conferma in corso…" : "Confermo"}
            </button>
            <Link to="/merchant/discount" data-testid="conferma-offerta-modifica"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-ac-teal bg-white px-5 text-base font-extrabold">
              <Pencil size={18} aria-hidden="true" /> Voglio modificarla
            </Link>
            <p className="text-center text-xs text-ac-soft">Per modificarla ti chiediamo di entrare nella tua area commercianti.</p>
          </div>
        </div>
      )}

      {stato === "ok" && (
        <div data-testid="conferma-offerta-ok" className="rounded-2xl border border-ac-line bg-white p-6">
          <CheckCircle2 size={40} className="text-ac-verde" aria-hidden="true" />
          <h1 className="mt-3 font-serif text-3xl">Grazie, offerta confermata</h1>
          <p className="mt-2 text-sm leading-relaxed text-ac-soft">
            Ora la controlliamo. Quando la approviamo ti arriva un'email. Puoi seguirla dalla tua area commercianti.
          </p>
          <Link to="/merchant/dashboard" className="ac-grad mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 font-extrabold text-white">
            Vai alla tua area
          </Link>
        </div>
      )}

      {stato === "errore" && (
        <div data-testid="conferma-offerta-errore" className="rounded-2xl border border-ac-line bg-white p-6">
          <AlertCircle size={40} className="text-ac-rosa" aria-hidden="true" />
          <h1 className="mt-3 font-serif text-3xl">
            {errore.code === "link_scaduto" ? "Il link è scaduto" : errore.code === "link_usato" ? "Link già usato" : "Link non valido"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ac-soft">
            {errore.msg || "Questo link non è valido."} Puoi entrare nella tua area commercianti oppure scriverci
            su WhatsApp al <a className="font-bold text-ac-ink underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMERO}</a> o
            a <a className="font-bold text-ac-ink underline" href={`mailto:${EMAIL_INFO}`}>{EMAIL_INFO}</a>.
          </p>
          <Link to="/merchant/dashboard" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-ac-teal px-5 font-extrabold">
            Vai alla tua area
          </Link>
        </div>
      )}
    </main>
  );
}
