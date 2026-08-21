import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { MessageSquare, Star, Loader2, Phone } from "lucide-react";

function StarsRow({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={14} className={i <= n ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />
      ))}
    </div>
  );
}

export default function ReviewsCenter() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/reviews")
      .then((r) => setReviews(r.data.reviews || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card data-testid="reviews-center" className="border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="text-ciano" size={20} />
        <h2 className="font-serif text-2xl text-white">Centro Feedback Privati</h2>
        <span className="ml-auto text-xs text-white/50">{reviews.length} recensioni · &lt;3⭐ evidenziate in rosso</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-fucsia" size={24}/></div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="text-center py-10 text-white/50">Ancora nessun feedback ricevuto.</div>
      )}

      <div className="space-y-3">
        {reviews.map((r) => {
          const isNegative = r.stars < 3 && (r.private_comment || "").trim().length > 0;
          const dt = r.created_at ? new Date(r.created_at) : null;
          return (
            <div
              key={r.id}
              data-testid={`review-row-${r.id}`}
              className={`rounded-xl border p-4 ${isNegative ? "border-red-500/50 bg-red-500/10" : "border-white/10 bg-black/20"}`}
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarsRow n={r.stars} />
                    <span className="text-sm text-white/90 font-medium">{r.shop_name}</span>
                    <span className="text-xs text-white/40">·</span>
                    <span className="text-xs text-white/60">{r.discount_title}</span>
                  </div>
                  <div className="mt-2 text-xs text-white/50">
                    da <span className="text-white/80">{r.user_name || r.user_email}</span> · {dt?.toLocaleString("it-IT", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) || "-"}
                  </div>
                  {r.private_comment && (
                    <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${isNegative ? "bg-red-950/40 text-red-100 border border-red-500/40" : "bg-white/5 text-white/80"}`}>
                      "{r.private_comment}"
                    </div>
                  )}
                </div>
                {isNegative && r.merchant_phone && (
                  <a
                    data-testid={`review-wa-${r.id}`}
                    href={`https://wa.me/${(r.merchant_phone||"").replace(/[^0-9+]/g,"")}?text=${encodeURIComponent(`Ciao, sono l'amministratore di Sconti Roma. Un cliente ha lasciato un feedback importante sulla vostra offerta "${r.discount_title}". Possiamo parlarne?`)}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-green-500 hover:bg-green-400 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    <Phone size={12}/> Contatta su WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
