import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { MapPin, Clock, ArrowLeft, TicketPercent, Shield } from "lucide-react";

export default function DiscountDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subActive, setSubActive] = useState(false);
  const [redemption, setRedemption] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    api.get(`/discounts/${id}`)
      .then((r) => setDiscount(r.data.discount))
      .catch(() => nav("/discounts"))
      .finally(() => setLoading(false));
  }, [id, nav]);

  useEffect(() => {
    if (user && user.role === "client") {
      api.get("/subscription/me").then((r) => setSubActive(r.data.active));
    }
  }, [user]);

  const redeem = async () => {
    if (!user) return nav("/login");
    if (user.role !== "client") return toast.error("Solo i clienti possono riscattare");
    if (!subActive) return nav("/subscribe");
    try {
      const { data } = await api.post(`/redemptions/create/${id}`);
      setRedemption(data.redemption);
      setDialogOpen(true);
      // Immediately fetch first token
      fetchToken(data.redemption.id);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const fetchToken = async (rid) => {
    try {
      const { data } = await api.get(`/redemptions/${rid}/token`);
      setTokenData(data);
      setCountdown(data.expires_in);
    } catch (e) {
      console.error(e);
    }
  };

  // Poll token every 10s while dialog is open + tick down countdown every 1s
  useEffect(() => {
    if (dialogOpen && redemption) {
      pollRef.current = setInterval(() => fetchToken(redemption.id), 10000);
      tickRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? 10 : c - 1)), 1000);
      return () => {
        clearInterval(pollRef.current);
        clearInterval(tickRef.current);
      };
    }
  }, [dialogOpen, redemption]);

  if (loading || !discount) {
    return <div className="mx-auto max-w-7xl px-6 py-16 text-white/60">Caricamento…</div>;
  }

  const m = discount.merchant || {};
  const savings = (discount.original_price - discount.discounted_price).toFixed(2);

  return (
    <main data-testid="discount-detail-page" className="mx-auto max-w-6xl px-6 py-10">
      <button onClick={() => nav(-1)} className="mb-6 flex items-center gap-2 text-sm text-white/70 hover:text-terracotta">
        <ArrowLeft size={16} /> Indietro
      </button>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-warm">
          <img src={discount.image_url || m.image_url} alt={discount.title} className="h-full w-full object-cover" />
          <div className="absolute left-4 top-4 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white shadow-lg">
            −{discount.percent_off}%
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-3 text-xs uppercase tracking-wider">
            <span className="text-gold">{m.category}</span>
            <span className="text-white/50">·</span>
            <span className="flex items-center gap-1 text-white/70"><MapPin size={12} /> {m.zone}</span>
          </div>
          <h1 className="font-serif text-4xl leading-tight text-white">{discount.title}</h1>
          <div className="mt-2 text-lg text-white/70">{m.shop_name}</div>
          <p className="mt-6 text-white/80">{discount.description}</p>

          <Card className="mt-6 border-warm bg-white/5 p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold">Prezzo con sconto</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-serif text-5xl font-semibold text-terracotta">€{discount.discounted_price.toFixed(2)}</span>
                  <span className="text-lg text-white/50 line-through">€{discount.original_price.toFixed(2)}</span>
                </div>
                <div className="mt-1 text-sm text-white/70">Risparmi <strong>€{savings}</strong></div>
              </div>
              <TicketPercent size={40} className="text-terracotta/40" />
            </div>
            <Button
              data-testid="redeem-btn"
              onClick={redeem}
              size="lg"
              className="mt-6 w-full grad-fucsia-viola text-white hover:scale-105 transition"
            >
              {!user ? "Accedi per riscattare" :
                user.role !== "client" ? "Riservato ai clienti" :
                !subActive ? "Abbonati per riscattare" :
                "Ottieni QR Code"}
            </Button>
          </Card>

          {discount.terms && (
            <div className="mt-6 flex gap-3 rounded-lg border border-warm bg-[#141414] border border-white/10 p-4 text-sm text-white/70">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-gold">Termini</div>
                {discount.terms}
              </div>
            </div>
          )}

          {m.address && (
            <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
              <MapPin size={14} className="text-terracotta" /> {m.address}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="qr-dialog" className="max-w-sm bg-[#141414] border border-white/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Il tuo codice sconto</DialogTitle>
          </DialogHeader>
          {redemption && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative rounded-xl p-4 glow-fucsia bg-white">
                <QRCodeSVG value={tokenData?.qr_value || redemption.code} size={220} fgColor="#0A0A0A" bgColor="#ffffff" level="M" />
                <div className="absolute -top-3 -right-3 flex h-12 w-12 items-center justify-center rounded-full grad-fucsia-viola text-white font-bold shadow-lg text-sm">
                  {countdown}s
                </div>
              </div>
              <div data-testid="redemption-code" className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs uppercase tracking-[0.2em] text-ciano">
                  <Shield size={12} /> Codice sicuro rotante
                </div>
                <div className="mt-1 font-mono text-2xl tracking-[0.3em] text-white">{redemption.code}</div>
              </div>
              <p className="text-center text-sm text-white/60">
                Il QR cambia ogni 10 secondi per la tua sicurezza. Mostralo al commerciante di <strong className="text-white">{m.shop_name}</strong>.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
