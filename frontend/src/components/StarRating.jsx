import { Star } from "lucide-react";

/**
 * Stelle stile Groupon (solo rating, nessun commento).
 * Riempimento parziale per medie tipo 4.3.
 */
export default function StarRating({ avg, count, size = 16 }) {
  if (!count || !avg) return null;
  return (
    <div data-testid="star-rating" className="flex items-center gap-2">
      <span className="text-sm font-bold text-gold">{String(avg).replace(".", ",")}</span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, avg - i));
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="absolute inset-0 text-white/25" fill="currentColor" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="text-gold" fill="currentColor" />
              </span>
            </span>
          );
        })}
      </div>
      <span className="text-sm text-white/50">({count.toLocaleString("it-IT")})</span>
    </div>
  );
}
