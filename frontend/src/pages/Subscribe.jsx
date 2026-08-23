import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, Shield, Sparkles, Zap, CreditCard, AlertTriangle, X } from "lucide-react";
import PayPalCheckout from "@/components/PayPalCheckout";

export default function Subscribe() {
  const nav = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("card"); // "card" | "paypal"
  // Doppia conferma disdetta
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [finalConfirm, setFinalConfirm] = useState(false); // step 2: checkbox esplicita
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const refresh = () => api.get("/subscription/me").then((r) => setSub(r.data.subscription));
  useEffect(() => { refresh(); }, []);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/payments/checkout", { origin_url: window.location.origin });
      if (data.checkout_url) {
        // Se siamo dentro un iframe (es. "View Preview" di Emergent), Stripe non permette
        // il caricamento in-frame. Facciamo il redirect sulla finestra top oppure apriamo
        // una nuova scheda come fallback.
        const inIframe = window.self !== window.top;
        if (inIframe) {
          try {
            window.top.location.href = data.checkout_url;
          } catch (_) {
            // parent cross-origin → apri in nuova tab
            window.open(data.checkout_url, "_blank", "noopener,noreferrer");
          }
        } else {
          window.location.href = data.checkout_url;
        }
      } else {
        toast.error("Errore avvio pagamento");
        setLoading(false);
      }
    } catch (e) {
      toast.error(formatApiError(e));
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!finalConfirm) return; // safety net
    setCancelling(true);
    try {
      await api.post("/subscription/cancel", {
        reason: cancelReason || "user_requested",
        feedback: cancelFeedback || "",
      });
      setSub(null);
      setShowCancelDialog(false);
      setFinalConfirm(false);
      setCancelReason("");
      setCancelFeedback("");
      toast.success("Abbonamento cancellato. Ci dispiace vederti andare!");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setCancelling(false);
    }
  };

  const closeCancelDialog = () => {
    if (cancelling) return;
    setShowCancelDialog(false);
    setFinalConfirm(false);
  };

  return (
    <main data-testid="subscribe-page" className="mx-auto max-w-3xl px-6 py-16 text-white">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Membership Sconti Roma</div>
        <h1 className="mt-3 font-serif text-5xl">Un caffè al mese.<br/><span className="italic text-grad">Roma per un anno.</span></h1>
      </div>

      <Card className="mt-10 border-white/10 bg-white/5 backdrop-blur p-8">
        {sub ? (
          <div data-testid="active-subscription">
            <div className="flex items-center gap-3 text-fucsia">
              <div className="flex h-12 w-12 items-center justify-center rounded-full grad-fucsia-viola glow-fucsia text-white">
                <Check size={22} />
              </div>
              <div>
                <div className="font-serif text-3xl text-white">Abbonamento attivo</div>
                <div className="text-sm text-white/60">Valido fino al {new Date(sub.end_date).toLocaleDateString("it-IT")}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="flex justify-between border-b border-white/10 py-2 text-white/80"><span>Piano</span><span>Mensile — €{sub.price_eur}</span></div>
              <div className="flex justify-between border-b border-white/10 py-2 text-white/80"><span>Provider</span><span>{sub.provider === 'stripe' ? 'Stripe (test mode)' : 'Mock'}</span></div>
              <div className="flex justify-between border-b border-white/10 py-2 text-white/80"><span>Stato</span><span className="text-fucsia">Attivo</span></div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => nav("/discounts")} className="grad-fucsia-viola text-white hover:scale-105 transition rounded-full">Sfoglia gli sconti</Button>
              <Button
                data-testid="cancel-sub-btn"
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="rounded-full border-white/20 text-white hover:bg-white/10"
              >
                Gestisci abbonamento
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-7xl text-grad">€2,99</span>
              <span className="text-white/60">/ mese</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                { i: <Zap size={14} className="text-ciano" />, t: "Sconto in ogni locale partner di Roma" },
                { i: <Sparkles size={14} className="text-neon" />, t: "Nessun limite mensile all'utilizzo" },
                { i: <Shield size={14} className="text-fucsia" />, t: "QR sicuro rotante ogni 10 secondi" },
                { i: <Check size={14} className="text-ciano" />, t: "Cancelli quando vuoi, senza penali" },
              ].map((f, idx) => (
                <li key={idx} className="flex items-center gap-3">{f.i} {f.t}</li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/60 flex items-center gap-2">
              <Shield size={14} className="text-ciano" />
              Pagamento sicuro con Stripe o PayPal · Cancelli quando vuoi, senza penali
            </div>

            {/* Tab metodo di pagamento */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-black/40 p-1 border border-white/10">
              <button
                type="button"
                data-testid="tab-card"
                onClick={() => setMethod("card")}
                className={`rounded-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
                  method === "card" ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                <CreditCard size={14} /> Carta (Stripe)
              </button>
              <button
                type="button"
                data-testid="tab-paypal"
                onClick={() => setMethod("paypal")}
                className={`rounded-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
                  method === "paypal" ? "bg-[#FFC439] text-[#003087]" : "text-white/70 hover:text-white"
                }`}
              >
                <span className="font-serif font-bold">Pay<span className="text-[#009cde]">Pal</span></span>
              </button>
            </div>

            {method === "card" ? (
              <Button
                data-testid="subscribe-btn"
                onClick={startCheckout}
                disabled={loading}
                size="lg"
                className="mt-4 w-full grad-fucsia-viola glow-fucsia text-white font-bold hover:scale-[1.02] transition rounded-full py-6 text-base"
              >
                {loading ? "Reindirizzamento a Stripe…" : "Paga con Stripe → €2,99/mese"}
              </Button>
            ) : (
              <div className="mt-4">
                <PayPalCheckout onSuccess={refresh} />
              </div>
            )}
          </>
        )}
      </Card>

      {/* DIALOG DOPPIA CONFERMA DISDETTA */}
      {showCancelDialog && (
        <div
          data-testid="cancel-dialog"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeCancelDialog}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#141419] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl text-white">Sei sicuro?</h2>
                  <div className="text-xs text-white/50">Stai per disdire l'abbonamento</div>
                </div>
              </div>
              <button
                data-testid="cancel-close"
                onClick={closeCancelDialog}
                className="text-white/50 hover:text-white transition"
                disabled={cancelling}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Cosa perdi */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="text-xs uppercase tracking-wider text-red-300 font-semibold mb-2">
                  Cosa perderai
                </div>
                <ul className="space-y-1 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <X size={14} className="text-red-400 mt-0.5 shrink-0" />
                    Accesso a tutti gli sconti dei nostri commercianti a Roma
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={14} className="text-red-400 mt-0.5 shrink-0" />
                    QR code dinamici per riscattare le offerte
                  </li>
                  {sub?.end_date && (
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                      <span>
                        Potrai continuare a usare gli sconti fino al{" "}
                        <strong className="text-white">
                          {new Date(sub.end_date).toLocaleDateString("it-IT")}
                        </strong>{" "}
                        (nessun rimborso, ma nessun altro addebito)
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Motivo opzionale */}
              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                  Perché disdici? <span className="text-white/40 lowercase">(opzionale, ci aiuta a migliorare)</span>
                </label>
                <select
                  data-testid="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={cancelling}
                  className="mt-2 w-full rounded-lg bg-black/50 border border-white/10 text-white text-sm px-3 py-2"
                >
                  <option value="">Scegli un motivo…</option>
                  <option value="too_expensive">Troppo caro</option>
                  <option value="not_using_enough">Non lo uso abbastanza</option>
                  <option value="not_enough_shops">Pochi negozi nella mia zona</option>
                  <option value="bad_experience">Brutta esperienza in un locale</option>
                  <option value="found_better">Ho trovato di meglio</option>
                  <option value="temporary">Solo temporaneo, tornerò</option>
                  <option value="other">Altro</option>
                </select>
                <textarea
                  data-testid="cancel-feedback"
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  disabled={cancelling}
                  placeholder="Vuoi dirci qualcosa di più? (facoltativo)"
                  rows={2}
                  className="mt-2 w-full rounded-lg bg-black/50 border border-white/10 text-white text-sm px-3 py-2 placeholder:text-white/30"
                />
              </div>

              {/* Doppia conferma checkbox */}
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                <input
                  data-testid="cancel-final-confirm"
                  type="checkbox"
                  checked={finalConfirm}
                  onChange={(e) => setFinalConfirm(e.target.checked)}
                  disabled={cancelling}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-red-500 cursor-pointer"
                />
                <span className="text-sm text-white/85 leading-snug">
                  <strong className="text-red-300">Confermo</strong> di voler disdire l'abbonamento a Sconti Roma. Ho letto cosa perdo e sono consapevole che l'operazione è definitiva.
                </span>
              </label>
            </div>

            {/* Footer con 2 azioni */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-white/10 bg-black/40 p-4">
              <Button
                data-testid="cancel-keep-btn"
                onClick={closeCancelDialog}
                disabled={cancelling}
                variant="outline"
                className="w-full sm:w-auto rounded-full border-fucsia/40 bg-fucsia/10 text-fucsia hover:bg-fucsia/20"
              >
                No, mantieni l'abbonamento
              </Button>
              <Button
                data-testid="cancel-confirm-btn"
                onClick={cancel}
                disabled={!finalConfirm || cancelling}
                className={`w-full sm:flex-1 rounded-full transition ${
                  finalConfirm
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-white/5 text-white/40 cursor-not-allowed"
                }`}
              >
                {cancelling ? "Cancellazione in corso…" : "Sì, disdici definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
