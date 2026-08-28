import { trackClick } from "@/lib/analytics";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { MapPin, Clock, ArrowLeft, Shield, ChevronLeft, ChevronRight, Phone, MessageCircle, Store } from "lucide-react";
import MiniMap from "@/components/MiniMap";
import { renderBold } from "@/lib/renderBold";
import StarRating from "@/components/StarRating";

// Normalizza il numero di telefono in formato E.164 per link tel: / wa.me
// Accetta "+39 06 12345", "06 12345", "0039 06 12345" e restituisce { digits, telHref, waHref, isMobile }
function normalizePhone(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[^\d+]/g, "");
  // Converte 0039 → +39 (formato internazionale con 00)
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  // Se non ha prefisso internazionale, presumiamo Italia (+39) — mantiene il 0 per fissi
  if (!digits.startsWith("+")) digits = "+39" + digits;
  // wa.me vuole solo cifre (no +)
  const waDigits = digits.replace(/^\+/, "");
  // Mobile italiano: +393xxxxxxxx (10 digits dopo il prefisso, prima cifra 3)
  const localPart = digits.replace(/^\+39/, "");
  const isMobile = /^3\d{8,9}$/.test(localPart);
  return {
    display: trimmed,
    telHref: `tel:${digits}`,
    waHref: `https://wa.me/${waDigits}?text=${encodeURIComponent(
      "Ciao! Ho l'abbonamento attivo a Sconti Roma e vorrei prenotare per usufruire dello sconto. Grazie!"
    )}`,
    isMobile,
  };
}

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
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [usageInfo, setUsageInfo] = useState({ used_count: 0, max_uses: 1, remaining: 1, used_today: false });
  const [windowSec, setWindowSec] = useState(20);
  const [photoIdx, setPhotoIdx] = useState(0);
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
      api.get(`/redemptions/discount/${id}/status`).then((r) => {
        setAlreadyUsed(!!r.data.used_this_month);
        setUsageInfo({
          used_count: r.data.used_count || 0,
          max_uses: r.data.max_uses || 1,
          remaining: typeof r.data.remaining === "number" ? r.data.remaining : (r.data.used_this_month ? 0 : 1),
          used_today: !!r.data.used_today,
        });
      }).catch(() => {});
    }
  }, [user, id]);

  const redeem = async () => {
    if (!user) return nav("/login");
    if (user.role !== "client") return toast.error("Solo i clienti possono riscattare");
    if (!subActive) return nav("/subscribe");
    try {
      const { data } = await api.post(`/redemptions/create/${id}`);
      trackClick("qr_generated");
      setRedemption(data.redemption);
      setDialogOpen(true);
      // Immediately fetch first token
      fetchToken(data.redemption.id);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const fetchToken = useCallback(async (rid) => {
    try {
      const { data } = await api.get(`/redemptions/${rid}/token`);
      setTokenData(data);
      setCountdown(data.expires_in);
      setWindowSec(data.window_sec || 20);
    } catch (err) {
      console.warn("[discount-detail] token fetch failed:", err?.message || err);
    }
  }, []);

  // Poll token every window_sec while dialog is open + tick down countdown every 1s
  useEffect(() => {
    if (dialogOpen && redemption) {
      pollRef.current = setInterval(() => fetchToken(redemption.id), (windowSec || 20) * 1000);
      tickRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? (windowSec || 20) : c - 1)), 1000);
      return () => {
        clearInterval(pollRef.current);
        clearInterval(tickRef.current);
      };
    }
  }, [dialogOpen, redemption, windowSec, fetchToken]);

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
        {(() => {
          const gallery = (Array.isArray(discount.image_urls) && discount.image_urls.length > 0)
            ? discount.image_urls
            : [discount.image_url || m.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"];
          const current = gallery[photoIdx] || gallery[0];
          const hasMulti = gallery.length > 1;
          return (
            <div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-warm bg-gradient-to-br from-fucsia/20 to-ciano/10">
                <img
                  data-testid="discount-hero-image"
                  src={current}
                  alt={discount.title}
                  className="h-full w-full object-cover transition-opacity duration-300"
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"; }}
                />
                <div className="absolute left-4 top-4 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white shadow-lg">
                  −{discount.percent_off}%
                </div>
                {hasMulti && (
                  <>
                    <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                      +{gallery.length - 1} immagini
                    </div>
                    <button
                      data-testid="gallery-prev"
                      onClick={() => setPhotoIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-fucsia transition"
                      aria-label="Foto precedente"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      data-testid="gallery-next"
                      onClick={() => setPhotoIdx((i) => (i + 1) % gallery.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-fucsia transition"
                      aria-label="Foto successiva"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 rounded-full bg-black/60 px-3 py-1.5">
                      {gallery.map((url, i) => (
                        <button
                          key={`dot-${url}-${i}`}
                          data-testid={`gallery-dot-${i}`}
                          onClick={() => setPhotoIdx(i)}
                          className={`h-1.5 rounded-full transition-all ${i === photoIdx ? "w-6 bg-fucsia" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                          aria-label={`Foto ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {hasMulti && (
                <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {gallery.map((url, i) => (
                    <button
                      key={`thumb-${url}-${i}`}
                      data-testid={`gallery-thumb-${i}`}
                      onClick={() => setPhotoIdx(i)}
                      className={`aspect-square overflow-hidden rounded-md border-2 transition ${i === photoIdx ? "border-fucsia scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={url} alt={`foto ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div>
          <div className="mb-2 flex items-center gap-3 text-xs uppercase tracking-wider">
            <span className="text-gold">{m.category}</span>
            <span className="text-white/50">·</span>
            <span className="flex items-center gap-1 text-white/70"><MapPin size={12} /> {m.zone}</span>
          </div>
          <h1 className="font-serif text-4xl leading-tight text-white">{discount.title}</h1>
          <div className="mt-2 text-lg text-white/70">{m.shop_name}</div>
          {discount.rating_count > 0 && (
            <div className="mt-1.5">
              <StarRating avg={discount.rating_avg} count={discount.rating_count} />
            </div>
          )}
          {m.address && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-white/60 underline underline-offset-4 decoration-white/30">
              <MapPin size={13} className="text-terracotta shrink-0" /> {m.address}
            </div>
          )}
          <p className="mt-5 text-white/80">{renderBold(discount.description)}</p>

          {/* Card offerta — stile Groupon (bordo marcato, prezzo barrato, badge %, CTA grande) */}
          <Card className="mt-6 overflow-hidden rounded-2xl border-2 border-fucsia/50 bg-white/5 p-0">
            <div className="p-5">
              <div className="font-bold text-xl leading-snug text-white">{discount.title}</div>
              {discount.sales_this_month > 0 && (
                <div data-testid="social-proof" className="mt-1.5 text-sm text-white/50">
                  +{discount.sales_this_month} utilizzati questo mese
                </div>
              )}
            </div>
            <div className="bg-black/30 p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-lg text-white/45 line-through">€{discount.original_price.toFixed(2)}</span>
                <span data-testid="discounted-price" className="font-serif text-4xl font-bold text-fucsia">€{discount.discounted_price.toFixed(2)}</span>
                <span className="rounded-md bg-ciano/15 px-2.5 py-1 text-sm font-bold text-ciano">
                  {discount.percent_off}% di sconto
                </span>
              </div>
              <div className="mt-1 text-sm text-white/60">Risparmi <strong className="text-white">€{savings}</strong> con l'abbonamento Sconti Roma</div>

            {/* Contatore utilizzi mensili (solo per abbonati / clienti registrati) */}
            {user?.role === "client" && (usageInfo.max_uses > 1 || alreadyUsed) && (
              <div
                data-testid="usage-counter"
                className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm"
              >
                <div className="text-white/70">
                  Utilizzi questo mese
                </div>
                <div className="font-mono text-white">
                  <span className={usageInfo.remaining > 0 ? "text-fucsia font-bold" : "text-red-400 font-bold"}>
                    {usageInfo.used_count}
                  </span>
                  <span className="text-white/40"> / {usageInfo.max_uses}</span>
                  {usageInfo.remaining > 0 && (
                    <span className="ml-2 text-xs text-white/50">({usageInfo.remaining} rimasti)</span>
                  )}
                </div>
              </div>
            )}
            {/* Nota limite giornaliero per abbonati con sconto multi-uso */}
            {user?.role === "client" && usageInfo.max_uses > 1 && (
              <div data-testid="daily-limit-note" className="mt-2 text-xs text-white/50">
                ⓘ Massimo <strong className="text-white/80">1 utilizzo al giorno</strong>: i {usageInfo.max_uses} utilizzi
                mensili vanno usati in giornate diverse.
              </div>
            )}
            {/* Badge informativo per NON abbonati */}
            {(!user || user.role !== "client") && discount.max_uses_per_month > 1 && (
              <div className="mt-4 rounded-lg border border-fucsia/30 bg-fucsia/10 px-4 py-2 text-xs text-fucsia">
                Fino a <strong>{discount.max_uses_per_month} utilizzi al mese</strong> per abbonato (max 1 al giorno)
              </div>
            )}

            <Button
              data-testid="redeem-btn"
              onClick={redeem}
              disabled={alreadyUsed || (usageInfo.used_today && user?.role === "client")}
              size="lg"
              className={`mt-5 w-full rounded-full py-6 text-lg font-bold text-white hover:scale-[1.02] transition ${alreadyUsed || (usageInfo.used_today && user?.role === "client") ? "bg-white/10 hover:scale-100 cursor-not-allowed" : "grad-fucsia-viola shadow-lg shadow-fucsia/30"}`}
            >
              {!user ? "Accedi per riscattare" :
                user.role !== "client" ? "Riservato ai clienti" :
                !subActive ? "Abbonati per riscattare" :
                alreadyUsed ? (usageInfo.max_uses > 1
                  ? `Hai già usato tutti i ${usageInfo.max_uses} utilizzi del mese`
                  : "Sconto già utilizzato questo mese. Torna il mese prossimo!") :
                usageInfo.used_today ? "Già usato oggi — torna domani!" :
                usageInfo.max_uses > 1 && usageInfo.used_count > 0
                  ? `Genera QR (utilizzo ${usageInfo.used_count + 1} di ${usageInfo.max_uses})`
                  : "Mostra QR Code"}
            </Button>
            </div>
          </Card>

          {/* Il negozio — descrizione scritta dal commerciante (stile Groupon) */}
          {m.shop_description && (
            <Card data-testid="shop-description-section" className="mt-6 rounded-2xl border-white/10 bg-[#141414] p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
                <Store size={14} /> Il negozio
              </div>
              <div className="mt-2 font-serif text-2xl text-white">{m.shop_name}</div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/75">{renderBold(m.shop_description)}</p>
            </Card>
          )}

          {/* Sezioni informative stile Groupon */}
          {(() => {
            const p = normalizePhone(m.phone);
            const sections = [
              {
                key: "plan-ahead",
                title: "Pianifica in anticipo",
                body: discount.plan_ahead,
                extra: p ? `Appuntamento tramite telefono ${m.phone}, anche su WhatsApp.` : null,
              },
              { key: "validity", title: "Inclusioni ed esclusioni", body: discount.validity_info },
              { key: "additional", title: "Informazioni aggiuntive", body: discount.additional_info },
              { key: "terms", title: "Fine print", body: discount.terms },
            ].filter((s) => s.body && s.body.trim());
            if (sections.length === 0) return null;
            return (
              <Card data-testid="info-sections" className="mt-6 rounded-2xl border-white/10 bg-[#141414] p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
                  <Clock size={14} /> Da sapere prima di andare
                </div>
                <div className="mt-4 space-y-5">
                  {sections.map((s) => (
                    <div key={s.key} data-testid={`info-${s.key}`}>
                      <div className="text-sm font-bold text-white">{s.title}</div>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-white/70">
                        {renderBold(s.body)}
                        {s.extra && <><br />{s.extra}</>}
                      </p>
                    </div>
                  ))}
                  <div data-testid="info-legal" className="border-t border-white/10 pt-4">
                    <div className="text-sm font-bold text-white">Informative legali</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      Il commerciante è l'unico responsabile verso gli abbonati per la cura e la qualità dei
                      prodotti e servizi pubblicizzati. Sconti Roma fornisce l'accesso allo sconto tramite
                      abbonamento; il servizio è erogato dal commerciante. Per assistenza e domande, consulta la{" "}
                      <a href="/support" className="text-ciano underline underline-offset-2">sezione Assistenza</a>.
                    </p>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Pulsante Chiama e Prenota (+ WhatsApp) — visibile solo se il commerciante ha inserito il numero */}
          {(() => {
            const p = normalizePhone(m.phone);
            if (!p) return null;
            return (
              <div data-testid="phone-booking-block" className="mt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={p.telHref}
                    data-testid="btn-call-merchant"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-lg shadow-terracotta/30 hover:scale-[1.02] hover:brightness-110 transition"
                  >
                    <Phone size={22} className="shrink-0" />
                    Chiama e Prenota con lo Sconto
                  </a>
                  <a
                    href={p.waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="btn-whatsapp-merchant"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] hover:brightness-110 transition"
                  >
                    <MessageCircle size={22} className="shrink-0" />
                    Scrivi su WhatsApp
                  </a>
                </div>
                <div className="mt-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-white/80">
                  <span className="mr-1">💡</span>
                  <strong className="text-gold">Consiglio furbo:</strong> ricorda di specificare a voce durante la chiamata:{" "}
                  <em className="text-white">"Ho l'abbonamento attivo a Sconti Roma"</em>{" "}
                  per bloccare il tuo tavolo/appuntamento e assicurarti lo sconto!
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Mini-mappa con posizione del negozio */}
      {typeof m.lat === "number" && typeof m.lng === "number" && (
        <div className="mt-8">
          <MiniMap
            lat={m.lat}
            lng={m.lng}
            shopName={m.shop_name}
            address={m.address}
          />
        </div>
      )}

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
              {/* Countdown progress bar */}
              <div className="w-full max-w-[220px]">
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full grad-fucsia-viola transition-all duration-1000 ease-linear" style={{width: `${(countdown / (windowSec || 20)) * 100}%`}} />
                </div>
                <div className="mt-2 text-center text-xs text-white/60">
                  Il codice scade tra <span className="text-fucsia font-bold">{countdown}s</span>
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
