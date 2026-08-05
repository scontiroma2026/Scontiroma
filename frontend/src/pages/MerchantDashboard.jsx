import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, TicketPercent, Users, TrendingUp } from "lucide-react";

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, redeemed: 0, pending: 0 });
  const [discount, setDiscount] = useState(null);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    api.get("/merchants/me/stats").then((r) => setStats(r.data));
    api.get("/merchants/me/discount").then((r) => setDiscount(r.data.discount));
    api.get("/merchants/me/redemptions").then((r) => setRedemptions((r.data.redemptions || []).slice(0, 5)));
  }, []);

  return (
    <main data-testid="merchant-dashboard" className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Commerciante</div>
          <h1 className="mt-2 font-serif text-5xl">{user?.shop_name || user?.name}</h1>
          <div className="mt-1 text-sm text-espresso/60">{user?.zone} · {user?.category}</div>
        </div>
        <Link to="/merchant/scan">
          <Button data-testid="go-scan-btn" size="lg" className="bg-terracotta text-white hover:bg-terracotta/90">
            <QrCode size={18} className="mr-2" /> Scansiona codice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<TicketPercent />} label="Codici generati" value={stats.total} />
        <StatCard icon={<Users />} label="Codici utilizzati" value={stats.redeemed} highlight />
        <StatCard icon={<TrendingUp />} label="In attesa" value={stats.pending} />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-5">
        <Card className="border-warm bg-white p-6 md:col-span-2">
          <div className="text-xs uppercase tracking-wider text-gold">La tua offerta</div>
          {discount ? (
            <>
              <h3 className="mt-3 font-serif text-2xl leading-tight">{discount.title}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl text-terracotta">€{discount.discounted_price.toFixed(2)}</span>
                <span className="text-sm text-espresso/50 line-through">€{discount.original_price.toFixed(2)}</span>
                <span className="ml-auto rounded-full bg-terracotta/10 px-3 py-1 text-xs font-semibold text-terracotta">−{discount.percent_off}%</span>
              </div>
              <Link to="/merchant/discount">
                <Button className="mt-6 w-full" variant="outline">Modifica offerta</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-espresso/70">Non hai ancora pubblicato uno sconto.</p>
              <Link to="/merchant/discount">
                <Button data-testid="create-offer-btn" className="mt-4 w-full bg-terracotta text-white hover:bg-terracotta/90">
                  Crea la tua offerta
                </Button>
              </Link>
            </>
          )}
        </Card>

        <Card className="border-warm bg-white p-6 md:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-gold">Ultimi codici</div>
            <span className="text-xs text-espresso/50">{redemptions.length} recenti</span>
          </div>
          {redemptions.length === 0 ? (
            <div className="rounded-lg bg-parchment p-8 text-center text-espresso/60">
              Ancora nessun codice riscattato.
            </div>
          ) : (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-warm bg-parchment/50 p-3 text-sm">
                  <div>
                    <div className="font-mono text-espresso">{r.code}</div>
                    <div className="text-xs text-espresso/60">{r.client_name}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${r.status === "redeemed" ? "bg-terracotta/10 text-terracotta" : "bg-gold/20 text-espresso"}`}>
                    {r.status === "redeemed" ? "Utilizzato" : "In attesa"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <Card className={`border-warm p-6 ${highlight ? "bg-espresso text-white" : "bg-white"}`}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${highlight ? "text-gold" : "text-gold"}`}>
        {icon} {label}
      </div>
      <div className={`mt-3 font-serif text-5xl ${highlight ? "text-white" : "text-espresso"}`}>{value}</div>
    </Card>
  );
}
