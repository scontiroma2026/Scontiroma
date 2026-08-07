import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TicketCheck, Sparkles } from "lucide-react";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    api.get("/subscription/me").then((r) => setSub(r.data.subscription));
    api.get("/redemptions/me").then((r) => setRedemptions(r.data.redemptions || []));
  }, []);

  return (
    <main data-testid="client-dashboard" className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Ciao {user?.name?.split(" ")[0]}</div>
        <h1 className="mt-2 font-serif text-5xl">Il tuo account</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-warm bg-[#141414] border border-white/10 p-6 md:col-span-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
            <Sparkles size={12} /> Abbonamento
          </div>
          {sub ? (
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
          ) : (
            <>
              <div className="mt-3 font-serif text-3xl text-white">Non attivo</div>
              <p className="mt-1 text-sm text-white/70">Attiva l'abbonamento per accedere agli sconti.</p>
              <Link to="/subscribe">
                <Button data-testid="activate-btn" className="mt-4 grad-fucsia-viola text-white hover:scale-105 transition">
                  Attiva a €4,99/mese
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
    </main>
  );
}
