import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
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

  const box = "mb-8 rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4";

  if (st.current_expired && !st.next_status) {
    return (
      <div data-testid="renewal-banner" data-state="expired" className={`${box} border-white/20 bg-white/5`}>
        <div className="flex items-start gap-3">
          <CalendarX className="mt-0.5 shrink-0 text-white/70" size={20} />
          <p className="text-sm text-white/80">La tua offerta è terminata e il negozio non compare tra gli sconti. Pubblica una nuova offerta: dopo l'approvazione torna visibile.</p>
        </div>
        <Link to="/merchant/discount">
          <Button className="grad-fucsia-viola text-white">Pubblica una nuova offerta</Button>
        </Link>
      </div>
    );
  }

  if (!st.window?.open || !st.current_active) return null;

  if (st.no_renew) {
    return (
      <div data-testid="renewal-banner" data-state="no-renew" className={`${box} border-white/20 bg-white/5`}>
        <div className="flex items-start gap-3">
          <CalendarX className="mt-0.5 shrink-0 text-white/70" size={20} />
          <p className="text-sm text-white/80">Hai scelto di non rinnovare: la tua offerta termina il <strong>{st.expires_on}</strong> e il 1° non riparte nulla.</p>
        </div>
        <Button data-testid="renewal-undo-btn" variant="outline" disabled={busy}
          className="border-white/20 text-white hover:bg-white/10" onClick={() => setNoRenew(false)}>
          Annulla, voglio rinnovare
        </Button>
      </div>
    );
  }

  const noRenewBtn = (
    <Button data-testid="renewal-no-renew-btn" variant="outline" disabled={busy}
      className="border-white/20 text-white hover:bg-white/10" onClick={() => setNoRenew(true)}>
      Non rinnovo
    </Button>
  );

  if (st.next_status) {
    const ok = st.next_status === "approved";
    const rejected = st.next_status === "rejected";
    return (
      <div data-testid="renewal-banner" data-state={st.next_status} className={`${box} border-white/15 bg-white/5`}>
        <div className="flex items-start gap-3">
          {ok ? <CheckCircle2 className="mt-0.5 shrink-0 text-fucsia" size={20} /> : <Clock className="mt-0.5 shrink-0 text-neon" size={20} />}
          <p className="text-sm text-white/80">
            {ok && <>L'offerta di {label} è approvata: parte il 1°.</>}
            {!ok && !rejected && <>L'offerta di {label} è in attesa di approvazione.</>}
            {rejected && <>L'offerta di {label} è stata rifiutata: modificala entro il <strong>{st.expires_on}</strong>, altrimenti il 1° il negozio resta senza offerta.</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rejected && (
            <Link to="/merchant/discount?tab=next">
              <Button className="grad-fucsia-viola text-white">Modifica l'offerta</Button>
            </Link>
          )}
          {noRenewBtn}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="renewal-banner" data-state="expiring" className={`${box} border-orange-400/50 bg-orange-500/10`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-orange-300" size={20} />
        <p className="text-sm text-white/90">
          La tua offerta scade il <strong>{st.expires_on}</strong> e non si rinnova da sola.
          Carica quella di {label} oppure scegli di non rinnovare.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/merchant/discount?tab=next">
          <Button data-testid="renewal-upload-btn" className="grad-fucsia-viola text-white">Carica l'offerta di {label}</Button>
        </Link>
        {noRenewBtn}
      </div>
    </div>
  );
}
