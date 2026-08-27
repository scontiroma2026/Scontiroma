import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MapPin, ArrowRight, Zap, TrendingUp } from "lucide-react";

export default function DiscountCard({ discount }) {
  const m = discount.merchant || {};
  const savings = (discount.original_price - discount.discounted_price).toFixed(2);
  const sales = discount.sales_this_month ?? 0;
  return (
    <Link to={`/discounts/${discount.id}`} data-testid={`discount-card-${discount.id}`} className="group block">
      <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur transition-all hover:-translate-y-1 hover:border-fucsia hover:shadow-[0_0_40px_rgba(255,46,147,0.3)]">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
          src={discount.image_url || m.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"}
            alt={discount.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full grad-fucsia-viola px-3 py-1.5 text-xs font-bold text-white shadow-lg glow-fucsia">
            <Zap size={12} /> −{discount.percent_off}%
          </div>
          {sales > 0 && (
            <div
              data-testid={`sales-counter-${discount.id}`}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur px-2.5 py-1 text-xs font-semibold text-neon border border-neon/30"
            >
              <TrendingUp size={12} /> +{sales} utilizzati questo mese
            </div>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ciano font-semibold uppercase tracking-wider">{m.category}</span>
            <span className="flex items-center gap-1 text-white/60">
              <MapPin size={12} /> {m.zone}
            </span>
          </div>
          <h3 className="font-serif text-xl leading-snug text-white line-clamp-2">
            {discount.title}
          </h3>
          <p className="text-sm text-white/60">{m.shop_name}</p>
          <div className="flex items-end justify-between pt-2 border-t border-white/10">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-fucsia">€{discount.discounted_price.toFixed(2)}</span>
                <span className="text-sm text-white/40 line-through">€{discount.original_price.toFixed(2)}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-neon">Risparmi €{savings}</div>
            </div>
            <ArrowRight size={18} className="text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-fucsia" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
