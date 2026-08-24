import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TicketCheck, Sparkles, Star, AlertTriangle, CreditCard } from "lucide-react";
import MyUsedDiscounts from "@/components/MyUsedDiscounts";
import GdprSection from "@/components/GdprSection";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [pastDue, setPastDue] = useState(false);
  const [graceExpiresAt, setGraceExpiresAt] = useState(null);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    api.get("/subscription/me").then((r) => {
      setSub(r.data.subscription);
      setPastDue(!!r.data.past_due);
      setGraceExpiresAt(r.data.grace_expires_at || r.data.subscription?.grace_expires_at || null);
    });
    api.get("/redemptions/me").then((r) => setRedemptions(r.data.redemptions || []));
  }, []);

  // Se past_due, l'oggetto sub contiene i dettagli della subscription sospesa
  // ma non è "attivo" per il pubblico. Il banner sotto lo gestisce.
  const isActive = !!sub && !pastDue;

  return (
    <main data-testid="client-dashboard" className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Ciao {user?.name?.split(" ")[0]}</div>
        <h1 className="mt-2 font-serif text-5xl">Il tuo account</h1>
      </div>

      {/* BANNER SOSPENSIONE — visibile solo se past_due entro la finestra di 7gg */}
      {pastDue && graceExpiresAt && (
        <SuspendedBanner graceExpiresAt={graceExpiresAt} />
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-warm bg-[#141414] border border-white/10 p-6 md:col-span-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
            <Sparkles size={12} /> Abbonamento
          </div>
          {isActive ? (
            <>
              <div className="mt-3 font-serif text-3xl text-terracotta">Attivo</div>
              <div className="mt-1 text-sm text-white/70">
                Rinnovo automatico il {new Date(sub.end_date).toLocaleDateString("it-IT")} · €{sub.price_eur}/mese
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/discounts"><Button className="grad-fucsia-viola text-white hover:scale-105 transition">Sfoglia sconti</Button></Link>
                <Link to="/subscribe"><Button variant="outline">Gestisci</Button></Link>
              </div>
            </>
          ) : pastDue ? (
            <>
              <div className="mt-3 font-serif text-3xl text-red-400">Sospeso</div>
              <p className="mt-1 text-sm text-white/70">
                Aggiorna il metodo di pagamento per riattivarlo subito.
              </p>
              <Link to="/subscribe">
                <Button data-testid="resume-payment-btn" className="mt-4 bg-red-500 hover:bg-red-600 text-white">
                  <CreditCard size={16} className="mr-2" /> Aggiorna pagamento
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="mt-3 font-serif text-3xl text-white">Non attivo</div>
              <p className="mt-1 text-sm text-white/70">Attiva l'abbonamento per accedere agli sconti.</p>
              <Link to="/subscribe">
                <Button data-testid="activate-btn" className="mt-4 grad-fucsia-viola text-white hover:scale-105 transition">
                  Attiva a €2,99/mese
                </Button>
              </Link>
            </>
          )}
        </Card>

        <Card className="border-warm bg-espresso p-6 text-white">
          <div className="text-xs uppercase tracking-wider text-gold">Statistiche</div>
          <div className="mt-3 font-serif text-5xl">{redemptions.filter(r => r.status === "redeemed").length}</div>
          <div className="text-sm text-white/60">sconti utilizzati</div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="font-serif text-3xl">{redemptions.length}</div>
            <div className="text-sm text-white/60">codici generati</div>
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-serif text-3xl">I tuoi codici</h2>
        {redemptions.length === 0 ? (
          <Card className="border-warm bg-white/5 p-10 text-center text-white/60">
            Non hai ancora riscattato nessuno sconto.
          </Card>
        ) : (
          <div className="space-y-3">
            {redemptions.map((r) => (
              <Card key={r.id} data-testid={`redemption-${r.id}`} className="flex items-center justify-between border-warm bg-[#141414] border border-white/10 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-terracotta">
                    <TicketCheck size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-lg">{r.discount_title}</div>
                    <div className="text-xs text-white/60">{r.shop_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-lg tracking-wider text-white">{r.code}</div>
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <CalendarDays size={11} /> {new Date(r.created_at).toLocaleDateString("it-IT")}
                    </div>
                  </div>
                  <Badge variant={r.status === "redeemed" ? "secondary" : "default"} className={r.status === "redeemed" ? "bg-white/5 text-white" : "bg-terracotta text-white"}>
                    {r.status === "redeemed" ? "Utilizzato" : "Attivo"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="mb-2 font-serif text-3xl flex items-center gap-2"><Star size={22} className="text-yellow-400"/> I miei sconti usati</h2>
        <p className="text-sm text-white/60 mb-4">Lascia una recensione: 5 stelle sull'app, un commento privato solo per l'amministratore.</p>
        <MyUsedDiscounts />
      </div>

      <div className="mt-12">
        <GdprSection />
      </div>
    </main>
  );
}

/**
 * Banner rosso mostrato quando l'abbonamento è `past_due` (pagamento fallito al rinnovo).
 * Countdown live in giorni/ore/minuti fino a `grace_expires_at`, poi l'abbonamento decade.
 */
function SuspendedBanner({ graceExpiresAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000); // ricalcola ogni minuto
    return () => clearInterval(t);
  }, []);

  const deadline = new Date(graceExpiresAt).getTime();
  const remainingMs = Math.max(0, deadline - now);

  const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  const expired = remainingMs <= 0;

  let countdownText;
  if (expired) {
    countdownText = "L'abbonamento è decaduto";
  } else if (days >= 1) {
    countdownText = `Hai ${days} ${days === 1 ? "giorno" : "giorni"}${hours > 0 ? ` e ${hours}h` : ""} per pagare, poi decade`;
  } else if (totalHours >= 1) {
    const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
    countdownText = `Restano ${totalHours}h ${minutes}m — poi l'abbonamento decade definitivamente`;
  } else {
    const minutes = Math.floor(remainingMs / (1000 * 60));
    countdownText = `Restano solo ${minutes} minuti prima della decadenza definitiva!`;
  }

  return (
    <div
      data-testid="suspended-banner"
      className="mb-6 overflow-hidden rounded-2xl border-2 border-red-500/60 bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 shadow-2xl shadow-red-500/20"
      style={{ animation: "fadeInUp 0.5s ease-out" }}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/20 border border-red-500/60"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          >
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <div>
            <div className="font-serif text-xl text-red-100 leading-tight">
              Abbonamento sospeso
            </div>
            <div className="mt-1 text-sm text-red-200/80">
              Il pagamento al rinnovo non è andato a buon fine. Non puoi
              utilizzare gli sconti finché non aggiorni il metodo di pagamento.
            </div>
            <div
              data-testid="suspended-countdown"
              className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                expired
                  ? "bg-red-500 text-white"
                  : days <= 1
                  ? "bg-red-500/90 text-white animate-pulse"
                  : "bg-red-500/20 text-red-100 border border-red-500/40"
              }`}
            >
              ⏳ {countdownText}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <Link to="/subscribe">
            <Button
              data-testid="suspended-pay-btn"
              size="lg"
              className="w-full sm:w-auto bg-red-500 text-white font-bold hover:bg-red-600 hover:scale-105 transition shadow-lg shadow-red-500/40"
            >
              <CreditCard size={18} className="mr-2" />
              Aggiorna pagamento
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
