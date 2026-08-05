import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight } from "lucide-react";

export default function DiscountCard({ discount }) {
  const m = discount.merchant || {};
  const savings = (discount.original_price - discount.discounted_price).toFixed(2);
  return (
    <Link to={`/discounts/${discount.id}`} data-testid={`discount-card-${discount.id}`} className="group block">
      <Card className="overflow-hidden border-warm bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={discount.image_url || m.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"}
            alt={discount.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-white shadow-lg">
            −{discount.percent_off}%
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gold font-medium">{m.category}</span>
            <span className="flex items-center gap-1 text-espresso/60">
              <MapPin size={12} /> {m.zone}
            </span>
          </div>
          <h3 className="font-serif text-xl font-semibold leading-snug text-espresso line-clamp-2">
            {discount.title}
          </h3>
          <p className="text-sm text-espresso/60">{m.shop_name}</p>
          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-semibold text-terracotta">€{discount.discounted_price.toFixed(2)}</span>
                <span className="text-sm text-espresso/50 line-through">€{discount.original_price.toFixed(2)}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-gold">Risparmi €{savings}</div>
            </div>
            <ArrowRight size={18} className="text-espresso/40 transition-transform group-hover:translate-x-1 group-hover:text-terracotta" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
