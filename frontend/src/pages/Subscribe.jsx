import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, Shield, Sparkles, Zap } from "lucide-react";

export default function Subscribe() {
  const nav = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/subscription/me").then((r) => setSub(r.data.subscription));
  }, []);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/payments/checkout", { origin_url: window.location.origin });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
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
    try {
      await api.post("/subscription/cancel");
      setSub(null);
      toast.success("Abbonamento cancellato");
    } catch (e) {
      toast.error(formatApiError(e));
    }
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
              <Button data-testid="cancel-sub-btn" variant="outline" onClick={cancel} className="rounded-full border-white/20 text-white hover:bg-white/10">Annulla abbonamento</Button>
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
              Pagamento sicuro con Stripe · Modalità test (usa carta 4242 4242 4242 4242)
            </div>

            <Button
              data-testid="subscribe-btn"
              onClick={startCheckout}
              disabled={loading}
              size="lg"
              className="mt-6 w-full grad-fucsia-viola glow-fucsia text-white font-bold hover:scale-[1.02] transition rounded-full py-6 text-base"
            >
              {loading ? "Reindirizzamento a Stripe…" : "Paga con Stripe → €2,99/mese"}
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}
