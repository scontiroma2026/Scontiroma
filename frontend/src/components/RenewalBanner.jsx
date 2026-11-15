import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { CLASSE_PRIMARIO } from "@/components/AreaUI";
import { AlertTriangle, CalendarX, CheckCircle2, Clock } from "lucide-react";
import { dataIt } from "@/lib/durata";

// Di quanti giorni si può prolungare con un tocco (quelli che superano il massimo non compaiono)
const PROROGHE = [
  { giorni: 7, testo: "1 settimana" },
  { giorni: 14, testo: "2 settimane" },
  { giorni: 30, testo: "1 mese" },
];

/** Banner di scadenza dell'offerta nella dashboard del commerciante.
 *  Nessun rinnovo automatico: alla data di fine l'offerta termina, a meno che il negozio la prolunghi
 *  (un tocco, senza nuova approvazione) o abbia preparato la prossima. */
export default function RenewalBanner({ onChange }) {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [scelta, setScelta] = useState(false); // elenco delle proroghe aperto

  useEffect(() => {
    api.get("/merchants/me/renewal-status").then((r) => setSt(r.data)).catch(() => {});
  }, []);

  if (!st) return null;

  const setNoRenew = async (value) => {
    if (value) {
      const msg = st.next_status
        ? `Non vuoi rinnovare?\n\nL'offerta di adesso terminerà il ${st.expires_on} e la prossima che hai preparato verrà ritirata.\n\nPuoi cambiare idea finché l'offerta è online.`
        : `Non vuoi rinnovare?\n\nL'offerta di adesso terminerà il ${st.expires_on} e non riceverai altri promemoria.\n\nPuoi cambiare idea finché l'offerta è online.`;
      if (!window.confirm(msg)) return;
    }
    setBusy(true);
    try {
      const hadNext = Boolean(st.next_status);
      const r = await api.post("/merchants/me/no-renew", { no_renew: value });
      setSt(r.data);
      if (onChange) onChange();
      toast.success(value ? "Fatto: la tua offerta non verrà rinnovata." : "Va bene: puoi prolungarla o preparare la prossima offerta.");
      if (value && hadNext) window.location.reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Operazione non riuscita, riprova.");
    } finally {
      setBusy(false);
    }
  };

  const prolunga = async (giorni) => {
    setBusy(true);
    try {
      const r = await api.post("/merchants/me/discount/extend", { days: giorni });
      const fino = dataIt(r.data?.discount?.valid_until);
      toast.success(fino ? `Fatto: la tua offerta ora vale fino al ${fino}.` : "Fatto: offerta prolungata.");
      window.location.reload(); // la pagina rilegge offerta, scadenza e «Da fare»
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Non siamo riusciti a prolungarla, riprova.");
      setBusy(false);
    }
  };

  const box = "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4";
  const primario = `${CLASSE_PRIMARIO} min-h-12 px-5 text-sm`;
  const secondario =
    "inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-ac-soft bg-white px-4 text-sm font-extrabold text-ac-ink transition hover:bg-ac-tint disabled:opacity-50";

  if (st.current_expired && !st.next_status) {
    return (
      <div data-testid="renewal-banner" data-state="expired" className={`${box} border-ac-line bg-ac-tint`}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <CalendarX className="mt-0.5 shrink-0 text-ac-soft" size={20} aria-hidden="true" />
          <p className="text-sm font-semibold text-ac-ink">La tua offerta è terminata e il negozio non compare tra gli sconti. Pubblica una nuova offerta: dopo l'approvazione torna visibile.</p>
        </div>
        <Link to="/merchant/discount" className={`${primario} w-full sm:w-auto`}>Pubblica una nuova offerta</Link>
      </div>
    );
  }

  // L'avviso compare solo negli ultimi giorni dell'offerta online (o se la prossima è già stata preparata)
  if (!st.current_active || (!st.expiring && !st.next_status && !st.no_renew)) return null;

  if (st.no_renew) {
    return (
      <div data-testid="renewal-banner" data-state="no-renew" className={`${box} border-ac-line bg-ac-tint`}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <CalendarX className="mt-0.5 shrink-0 text-ac-soft" size={20} aria-hidden="true" />
          <p className="text-sm font-semibold text-ac-ink">Hai scelto di non rinnovare: la tua offerta termina il <strong>{st.expires_on}</strong> e dopo non riparte nulla.</p>
        </div>
        <button type="button" data-testid="renewal-undo-btn" disabled={busy} className={`${secondario} w-full sm:w-auto`} onClick={() => setNoRenew(false)}>
          Annulla, voglio rinnovare
        </button>
      </div>
    );
  }

  const noRenewBtn = st.expires_on ? (
    <button type="button" data-testid="renewal-no-renew-btn" disabled={busy} className={`${secondario} sm:flex-none`} onClick={() => setNoRenew(true)}>
      Non rinnovo
    </button>
  ) : null;

  if (st.next_status) {
    const ok = st.next_status === "approved";
    const rejected = st.next_status === "rejected";
    const colori = ok ? "border-ac-verde/40 bg-ac-verdeBg" : rejected ? "border-ac-rosso/40 bg-ac-rossoBg" : "border-ac-ambra/40 bg-ac-ambraBg";
    const parte = st.window?.starts_on ? `il ${dataIt(st.window.starts_on)}` : "appena approvata";
    return (
      <div data-testid="renewal-banner" data-state={st.next_status} className={`${box} ${colori}`}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {ok
            ? <CheckCircle2 className="mt-0.5 shrink-0 text-ac-verde" size={20} aria-hidden="true" />
            : <Clock className={`mt-0.5 shrink-0 ${rejected ? "text-ac-rosso" : "text-ac-ambra"}`} size={20} aria-hidden="true" />}
          <p className="text-sm font-semibold text-ac-ink">
            {ok && <>La prossima offerta è approvata: va online {parte}.</>}
            {!ok && !rejected && <>La prossima offerta è in attesa di approvazione{st.window?.starts_on ? <>: andrà online {parte}</> : null}.</>}
            {rejected && <>La prossima offerta è stata rifiutata: modificala{st.expires_on ? <> entro il <strong>{st.expires_on}</strong>, altrimenti dal giorno dopo il negozio resta senza offerta</> : null}.</>}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {rejected && (
            <Link to="/merchant/discount?tab=next" className={`${primario} sm:flex-none`}>Modifica l'offerta</Link>
          )}
          {noRenewBtn}
        </div>
      </div>
    );
  }

  const quanti = st.days_left === 1 ? "oggi è l'ultimo giorno" : `mancano ${st.days_left} giorni`;
  const proroghe = PROROGHE.filter((p) => p.giorni <= (st.max_extend_days || 0));
  return (
    <div data-testid="renewal-banner" data-state="expiring" className="mb-4 rounded-2xl border border-ac-ambra/50 bg-ac-ambraBg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-ac-ambra" size={20} aria-hidden="true" />
          <p className="text-sm font-semibold text-ac-ink">
            La tua offerta vale fino al <strong>{st.expires_on}</strong> ({quanti}) e non si rinnova da sola.{" "}
            {proroghe.length > 0 ? "Prolungala con un tocco, prepara la prossima oppure scegli di non rinnovare." : "Prepara la prossima oppure scegli di non rinnovare."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {proroghe.length > 0 && (
            <button type="button" data-testid="renewal-extend-btn" disabled={busy} aria-expanded={scelta} className={`${primario} sm:flex-none`} onClick={() => setScelta((v) => !v)}>
              Prolunga
            </button>
          )}
          <Link to="/merchant/discount?tab=next" data-testid="renewal-upload-btn" className={`${proroghe.length > 0 ? secondario : primario} sm:flex-none`}>Prepara la prossima</Link>
          {noRenewBtn}
        </div>
      </div>
      {scelta && proroghe.length > 0 && (
        <div data-testid="renewal-extend-scelte" className="mt-3 rounded-xl border border-ac-line bg-white p-3">
          <p className="text-sm font-bold text-ac-ink">Di quanto la prolunghi?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ac-soft">L'offerta resta uguale e online: non serve una nuova approvazione.</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {proroghe.map((p) => (
              <button
                key={p.giorni}
                type="button"
                data-testid={`renewal-extend-${p.giorni}`}
                disabled={busy}
                onClick={() => prolunga(p.giorni)}
                className="min-h-12 rounded-xl border-2 border-ac-campo bg-white px-1 text-sm font-extrabold text-ac-ink transition hover:border-ac-rosa disabled:opacity-50"
              >
                {p.testo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
