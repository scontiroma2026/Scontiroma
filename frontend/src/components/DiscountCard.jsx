import { trackClick } from "@/lib/analytics";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MapPin, ArrowRight, Zap, TrendingUp } from "lucide-react";
import StarRating from "@/components/StarRating";
import CuorePreferito from "@/components/CuorePreferito";
import { FotoOfferta } from "@/components/NoPhoto";

export default function DiscountCard({ discount }) {
  const m = discount.merchant || {};
  const savings = (discount.original_price - discount.discounted_price).toFixed(2);
  const sales = discount.sales_this_month ?? 0;
  return (
    <Link to={`/discounts/${discount.id}`} data-testid={`discount-card-${discount.id}`} className="group block" onClick={() => trackClick("discount_click")}>
      <Card className="overflow-hidden border-border bg-muted backdrop-blur transition-all hover:-translate-y-1 hover:border-fucsia hover:shadow-[0_0_40px_rgba(244,168,29,0.35)]">
        <div className="relative aspect-[4/3] overflow-hidden">
          <FotoOfferta
            src={discount.image_url || m.image_url}
            alt={discount.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-ac-miele px-3 py-1.5 text-xs font-bold text-ac-mieleInk shadow-lg">
            <Zap size={12} /> −{discount.percent_off}%
          </div>
          <CuorePreferito merchantId={m.id} className="absolute right-3 top-3" />
          {sales > 0 && (
            <div
              data-testid={`sales-counter-${discount.id}`}
              className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-neon border border-neon/30"
            >
              <TrendingUp size={12} /> +{sales} utilizzati questo mese
            </div>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ciano font-semibold uppercase tracking-wider">{m.category}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin size={12} /> {m.zone}
            </span>
          </div>
          <h3 className="font-serif text-xl leading-snug text-foreground line-clamp-2">
            {discount.title}
          </h3>
          <p className="text-sm text-muted-foreground">{m.shop_name}</p>
          {discount.rating_count > 0 && (
            <StarRating avg={discount.rating_avg} count={discount.rating_count} size={13} />
          )}
          <div className="flex items-end justify-between pt-2 border-t border-border">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-fucsia">€{discount.discounted_price.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">€{discount.original_price.toFixed(2)}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-neon">Risparmi €{savings}</div>
            </div>
            <ArrowRight size={18} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-fucsia" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
