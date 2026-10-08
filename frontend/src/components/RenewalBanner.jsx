import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { CLASSE_PRIMARIO } from "@/components/AreaUI";
import { AlertTriangle, CalendarX, CheckCircle2, Clock } from "lucide-react";

/** Banner di scadenza dell'offerta nella dashboard del commerciante.
 *  Nessun rinnovo automatico: senza l'offerta del mese dopo, quella attuale scade il 1°. */
export default function RenewalBanner() {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/merchants/me/renewal-status").then((r) => setSt(r.data)).catch(() => {});
  }, []);

  if (!st) return null;
  const label = st.window?.next_month_label || "il mese prossimo";

  const setNoRenew = async (value) => {
    if (value) {
      const msg = st.next_status
        ? `Non vuoi rinnovare?\n\nL'offerta attuale terminerà il ${st.expires_on} e quella di ${label} che hai caricato verrà ritirata.\n\nPuoi cambiare idea fino alla fine del mese.`
        : `Non vuoi rinnovare?\n\nL'offerta attuale terminerà il ${st.expires_on} e non riceverai altri promemoria.\n\nPuoi cambiare idea fino alla fine del mese.`;
      if (!window.confirm(msg)) return;
    }
    setBusy(true);
    try {
      const hadNext = Boolean(st.next_status);
      const r = await api.post("/merchants/me/no-renew", { no_renew: value });
      setSt(r.data);
      toast.success(value ? "Fatto: la tua offerta non verrà rinnovata." : "Va bene: ricordati di caricare l'offerta del mese prossimo.");
      if (value && hadNext) window.location.reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Operazione non riuscita, riprova.");
    } finally {
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

  if (!st.window?.open || !st.current_active) return null;

  if (st.no_renew) {
    return (
      <div data-testid="renewal-banner" data-state="no-renew" className={`${box} border-ac-line bg-ac-tint`}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <CalendarX className="mt-0.5 shrink-0 text-ac-soft" size={20} aria-hidden="true" />
          <p className="text-sm font-semibold text-ac-ink">Hai scelto di non rinnovare: la tua offerta termina il <strong>{st.expires_on}</strong> e il 1° non riparte nulla.</p>
        </div>
        <button type="button" data-testid="renewal-undo-btn" disabled={busy} className={`${secondario} w-full sm:w-auto`} onClick={() => setNoRenew(false)}>
          Annulla, voglio rinnovare
        </button>
      </div>
    );
  }

  const noRenewBtn = (
    <button type="button" data-testid="renewal-no-renew-btn" disabled={busy} className={`${secondario} sm:flex-none`} onClick={() => setNoRenew(true)}>
      Non rinnovo
    </button>
  );

  if (st.next_status) {
    const ok = st.next_status === "approved";
    const rejected = st.next_status === "rejected";
    const colori = ok ? "border-ac-verde/40 bg-ac-verdeBg" : rejected ? "border-ac-rosso/40 bg-ac-rossoBg" : "border-ac-ambra/40 bg-ac-ambraBg";
    return (
      <div data-testid="renewal-banner" data-state={st.next_status} className={`${box} ${colori}`}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {ok
            ? <CheckCircle2 className="mt-0.5 shrink-0 text-ac-verde" size={20} aria-hidden="true" />
            : <Clock className={`mt-0.5 shrink-0 ${rejected ? "text-ac-rosso" : "text-ac-ambra"}`} size={20} aria-hidden="true" />}
          <p className="text-sm font-semibold text-ac-ink">
            {ok && <>L'offerta di {label} è approvata: parte il 1°.</>}
            {!ok && !rejected && <>L'offerta di {label} è in attesa di approvazione.</>}
            {rejected && <>L'offerta di {label} è stata rifiutata: modificala entro il <strong>{st.expires_on}</strong>, altrimenti il 1° il negozio resta senza offerta.</>}
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

  return (
    <div data-testid="renewal-banner" data-state="expiring" className={`${box} border-ac-ambra/50 bg-ac-ambraBg`}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-ac-ambra" size={20} aria-hidden="true" />
        <p className="text-sm font-semibold text-ac-ink">
          La tua offerta scade il <strong>{st.expires_on}</strong> e non si rinnova da sola.
          Carica quella di {label} oppure scegli di non rinnovare.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link to="/merchant/discount?tab=next" data-testid="renewal-upload-btn" className={`${primario} sm:flex-none`}>Carica l'offerta di {label}</Link>
        {noRenewBtn}
      </div>
    </div>
  );
}
