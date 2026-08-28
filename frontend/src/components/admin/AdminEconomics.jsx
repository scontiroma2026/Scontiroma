import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Euro, TrendingUp, CreditCard, Wallet, Users, Info } from "lucide-react";
import { toast } from "sonner";

const fmt = (n) => `€${(n ?? 0).toFixed(2).replace(".", ",")}`;

export default function AdminEconomics({ hdrs }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/economics", hdrs())
      .then((r) => setData(r.data))
      .catch((err) => toast.error(formatApiError(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caricamento singolo al mount
  }, []);

  if (!data) return <div className="text-white/60">Caricamento…</div>;

  const cards = [
    { icon: Users, label: "Abbonati attivi", value: data.active_total, sub: `+${data.new_this_month} nuovi questo mese`, color: "text-ciano" },
    { icon: TrendingUp, label: "MRR lordo", value: fmt(data.mrr_gross), sub: `${data.active_total} × ${fmt(data.price_eur)}`, color: "text-fucsia" },
    { icon: CreditCard, label: "Commissioni stimate", value: fmt(data.fees.total), sub: `Stripe ${fmt(data.fees.stripe)} · PayPal ${fmt(data.fees.paypal)}`, color: "text-gold" },
    { icon: Euro, label: "Netto stimato / mese", value: fmt(data.net_estimated), sub: "MRR lordo − commissioni", color: "text-emerald-400" },
  ];

  return (
    <div data-testid="admin-economics" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-white/10 bg-white/5 p-5">
            <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${c.color}`}>
              <c.icon size={14} /> {c.label}
            </div>
            <div className="mt-2 font-serif text-4xl text-white">{c.value}</div>
            <div className="mt-1 text-xs text-white/50">{c.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-[#141414] p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
            <Wallet size={14} /> Netto per abbonato
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Stripe ({data.by_provider.stripe} abbonati)</span>
              <span className="font-bold text-white">{fmt(data.net_per_sub.stripe)} <span className="text-white/40 font-normal">su {fmt(data.price_eur)}</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">PayPal ({data.by_provider.paypal} abbonati)</span>
              <span className="font-bold text-white">{fmt(data.net_per_sub.paypal)} <span className="text-white/40 font-normal">su {fmt(data.price_eur)}</span></span>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">Commissioni: Stripe 1,5% + €0,25 (carte EU) · PayPal ~3,4% + €0,35.</p>
        </Card>

        <Card className="border-white/10 bg-[#141414] p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ciano">
            <Info size={14} /> Costi fissi mensili
          </div>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li className="flex justify-between"><span>Hosting Emergent</span><span className="text-white">50 crediti/mese</span></li>
            <li className="flex justify-between"><span>Email Resend</span><span className="text-white">€0 (fino a 3.000/mese)</span></li>
            <li className="flex justify-between"><span>Mappe (OSM/Nominatim)</span><span className="text-white">€0</span></li>
            <li className="flex justify-between"><span>Dominio + caselle Aruba</span><span className="text-white">~€10-30/anno</span></li>
          </ul>
          <p className="mt-3 text-xs text-white/40">Le commissioni Stripe/PayPal sono stime: quelle esatte dipendono dal tipo di carta/conto del cliente.</p>
        </Card>
      </div>
    </div>
  );
}
