import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, CreditCard, Sparkles } from "lucide-react";

export default function Subscribe() {
  const nav = useNavigate();
  const [sub, setSub] = useState(null);
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/subscription/me").then((r) => setSub(r.data.subscription));
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const last4 = card.replace(/\s/g, "").slice(-4) || "4242";
      const { data } = await api.post("/subscription/subscribe", { plan: "monthly", card_last4: last4 });
      setSub(data.subscription);
      toast.success("Abbonamento attivato! (mock)");
      setTimeout(() => nav("/discounts"), 800);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
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
    <main data-testid="subscribe-page" className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Membership Sconti Roma</div>
        <h1 className="mt-3 font-serif text-5xl">Un caffè al mese.<br/><span className="italic text-terracotta">Sconti per tutto l'anno.</span></h1>
      </div>

      <Card className="mt-10 border-warm bg-white p-8">
        {sub ? (
          <div data-testid="active-subscription">
            <div className="flex items-center gap-3 text-terracotta">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/10">
                <Check size={20} />
              </div>
              <div>
                <div className="font-serif text-2xl">Abbonamento attivo</div>
                <div className="text-sm text-espresso/60">Valido fino al {new Date(sub.end_date).toLocaleDateString("it-IT")}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-espresso/80">
              <div className="flex justify-between border-b border-warm py-2"><span>Piano</span><span>Mensile — €4,99</span></div>
              <div className="flex justify-between border-b border-warm py-2"><span>Metodo di pagamento</span><span>•••• {sub.card_last4}</span></div>
              <div className="flex justify-between border-b border-warm py-2"><span>Stato</span><span className="text-terracotta">Attivo</span></div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => nav("/discounts")} className="bg-terracotta text-white hover:bg-terracotta/90">Sfoglia gli sconti</Button>
              <Button data-testid="cancel-sub-btn" variant="outline" onClick={cancel}>Annulla abbonamento</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-6xl text-terracotta">€4,99</span>
              <span className="text-espresso/60">/ mese</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-espresso/80">
              {[
                "Sconto in ogni locale partner di Roma",
                "Nessun limite mensile all'utilizzo",
                "QR code istantaneo per ogni offerta",
                "Cancelli quando vuoi, senza penali",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2"><Sparkles size={14} className="text-gold" /> {f}</li>
              ))}
            </ul>

            <div className="mt-8 space-y-3">
              <Label htmlFor="card" className="flex items-center gap-2 text-espresso"><CreditCard size={14} /> Carta di pagamento (mock)</Label>
              <Input
                id="card"
                data-testid="card-input"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                placeholder="0000 0000 0000 0000"
              />
              <p className="text-xs text-espresso/50">
                💡 Questa è una simulazione. Nessun pagamento reale sarà effettuato.
              </p>
            </div>

            <Button
              data-testid="subscribe-btn"
              onClick={subscribe}
              disabled={loading}
              size="lg"
              className="mt-6 w-full bg-terracotta text-white hover:bg-terracotta/90"
            >
              {loading ? "Attivazione…" : "Attiva abbonamento — €4,99"}
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}
