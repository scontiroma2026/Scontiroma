import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Mail, CalendarClock, RefreshCw, Send } from "lucide-react";

const STATUS_BADGE = {
  approved: ["Approvata ✓", "bg-fucsia/15 border-fucsia/40 text-fucsia"],
  pending: ["In revisione", "bg-neon/15 border-neon/40 text-neon"],
  rejected: ["Rifiutata", "bg-destructive/15 border-destructive/40 text-destructive"],
  missing: ["Non caricata", "bg-white/5 border-white/15 text-white/50"],
};

/** Tab admin "Prossimo Mese": stato caricamento offerte di tutti i negozi + revisione. */
export default function AdminNextMonth({ hdrs }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/admin/next-offers", hdrs());
      setData(r.data);
    } catch (err) { toast.error(formatApiError(err)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try {
      await api.post(`/admin/next-offers/${id}/approve`, {}, hdrs());
      toast.success("Offerta mese prossimo approvata ✓ — attiva dal 1°");
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const reject = async (id) => {
    const reason = window.prompt("Motivo del rifiuto (visibile al commerciante):", "") || "";
    try {
      await api.post(`/admin/next-offers/${id}/reject`, { reason }, hdrs());
      toast.success("Offerta rimandata in bozza al commerciante");
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const runReminders = async () => {
    setBusy(true);
    try {
      const r = await api.post("/admin/next-offers/run-reminders", {}, hdrs());
      const d = r.data;
      toast.success(d.window_open ? `Promemoria inviati: ${d.sent} (controllati ${d.checked})` : "Finestra chiusa: nessun promemoria inviato");
      load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  const runRollover = async () => {
    if (!window.confirm("Eseguire ORA il passaggio mese?\n\n• Le offerte approvate del mese prossimo sostituiranno quelle correnti\n• Le offerte correnti senza sostituzione SCADRANNO\n\nQuesta azione normalmente avviene in automatico il 1° del mese alle 00:05.")) return;
    setBusy(true);
    try {
      const r = await api.post("/admin/next-offers/run-rollover", {}, hdrs());
      const d = r.data;
      toast.success(`Rollover eseguito: ${d.promoted} promosse, ${d.migrated_pending} in revisione, ${d.expired} scadute`);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  const toggleWindow = async () => {
    const win = data?.window;
    const payload = win?.overridden ? { open: null } : { open: !win?.open };
    try {
      await api.post("/admin/next-offers/window-override", payload, hdrs());
      toast.success(win?.overridden ? "Finestra tornata alla regola automatica (ultimi 7 giorni)" : `Finestra forzata ${!win?.open ? "APERTA" : "CHIUSA"}`);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  if (!data) return <div className="py-10 text-white/60">Caricamento…</div>;
  const { window: win, rows, summary } = data;

  return (
    <Card className="border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl">Offerte di {win.next_month_label}</h3>
          <p className="text-xs text-white/50 mt-1">
            Tutti i negozi dell'app: chi ha caricato l'offerta del mese prossimo e chi deve ancora farlo.
            Le offerte approvate sostituiranno quelle correnti il 1° del mese alle 00:05; quelle non sostituite scadranno.
          </p>
          <div data-testid="next-window-status" className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs">
            <CalendarClock size={13} className={win.open ? "text-neon" : "text-gold"} />
            Finestra caricamento: {win.open ? <strong className="text-neon">APERTA</strong> : <strong className="text-gold">CHIUSA (apre il {win.opens_on})</strong>}
            {win.overridden && <span className="text-ciano">· override manuale</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="next-run-reminders-btn" size="sm" variant="outline" disabled={busy} onClick={runReminders} className="rounded-full border-white/20 text-white hover:bg-white/10">
            <Mail size={13} className="mr-1.5" /> Invia promemoria ora
          </Button>
          <Button data-testid="next-window-override-btn" size="sm" variant="outline" disabled={busy} onClick={toggleWindow} className="rounded-full border-ciano/40 text-ciano hover:bg-ciano/10">
            <RefreshCw size={13} className="mr-1.5" /> {win.overridden ? "Ripristina automatico" : win.open ? "Forza chiusura" : "Apri finestra ora"}
          </Button>
          <Button data-testid="next-run-rollover-btn" size="sm" variant="outline" disabled={busy} onClick={runRollover} className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10">
            <Send size={13} className="mr-1.5" /> Esegui passaggio mese
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span data-testid="next-summary-total" className="rounded-full border border-white/15 bg-black/40 px-3 py-1">Negozi: <strong>{summary.total}</strong></span>
        <span className="rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-neon">In revisione: <strong>{summary.pending}</strong></span>
        <span className="rounded-full border border-fucsia/40 bg-fucsia/10 px-3 py-1 text-fucsia">Approvate: <strong>{summary.approved}</strong></span>
        <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-destructive">Rifiutate: <strong>{summary.rejected}</strong></span>
        <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-white/60">Non caricate: <strong>{summary.missing}</strong></span>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((r) => {
          const [label, cls] = STATUS_BADGE[r.next_status] || STATUS_BADGE.missing;
          const nd = r.next_offer;
          return (
            <div key={r.merchant_id} data-testid={`nextoffer-row-${r.merchant_id}`} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-lg text-white">{r.shop_name}</span>
                    <span className="text-xs text-white/40">{r.zone} · {r.category}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                    {r.reminder_sent && <span className="text-xs text-ciano" title="Email promemoria inviata">📧 promemoria inviato</span>}
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Offerta corrente: {r.current_offer
                      ? <span className="text-white/80">{r.current_offer.title} {r.current_offer.approval_status === "expired" ? "(scaduta)" : r.current_offer.active ? "" : "(disattivata)"}</span>
                      : <span className="text-white/40">nessuna</span>}
                  </div>
                  {nd && (
                    <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-3">
                      <div className="text-xs uppercase tracking-wider text-ciano">Offerta {win.next_month_label}</div>
                      <div className="font-medium text-white mt-1">{nd.title}</div>
                      <p className="text-sm text-white/60 mt-0.5 line-clamp-2">{nd.description}</p>
                      <div className="mt-1.5 flex items-baseline gap-2 text-sm">
                        <span className="text-fucsia font-bold">€{nd.discounted_price?.toFixed(2)}</span>
                        <span className="text-white/40 line-through">€{nd.original_price?.toFixed(2)}</span>
                        <span className="text-neon text-xs">−{nd.percent_off}%</span>
                        <span className="ml-2 text-xs text-white/50">🔁 {nd.max_uses_per_month || 1}× mese</span>
                      </div>
                      {nd.approval_note && <div className="mt-1 text-xs text-destructive">Motivo rifiuto: {nd.approval_note}</div>}
                    </div>
                  )}
                </div>
                {nd && (
                  <div className="flex shrink-0 flex-col gap-2">
                    {nd.approval_status !== "approved" && (
                      <Button data-testid={`nextoffer-approve-${nd.id}`} size="sm" onClick={() => approve(nd.id)} className="grad-fucsia-viola text-white rounded-full">
                        <Check size={13} className="mr-1" /> Approva
                      </Button>
                    )}
                    {nd.approval_status !== "rejected" && (
                      <Button data-testid={`nextoffer-reject-${nd.id}`} size="sm" variant="outline" onClick={() => reject(nd.id)} className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10">
                        <X size={13} className="mr-1" /> Rifiuta
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
