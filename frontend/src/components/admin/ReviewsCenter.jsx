import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { MessageSquare, Star, Loader2, Phone } from "lucide-react";
import AdminSearchInput from "@/components/admin/AdminSearchInput";

function StarsRow({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={14} className={i <= n ? "text-amber-800 fill-yellow-400" : "text-muted-foreground"} />
      ))}
    </div>
  );
}

export default function ReviewsCenter() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/admin/reviews")
      .then((r) => setReviews(r.data.reviews || []))
      .finally(() => setLoading(false));
  }, []);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? reviews.filter((r) =>
        [r.shop_name, r.discount_title, r.user_name, r.user_email, r.private_comment]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
    : reviews;

  return (
    <Card data-testid="reviews-center" className="border-border bg-muted p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="text-ciano" size={20} />
        <h2 className="font-serif text-2xl text-foreground">Centro Feedback Privati</h2>
        <span className="ml-auto text-xs text-muted-foreground">{reviews.length} recensioni · &lt;3⭐ evidenziate in rosso</span>
      </div>

      <div className="mb-4">
        <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca negozio, utente, commento…" testId="reviews-search" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-fucsia" size={24}/></div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">{q ? `Nessun feedback trovato per "${q}".` : "Ancora nessun feedback ricevuto."}</div>
      )}

      <div className="space-y-3">
        {filtered.map((r) => {
          const isNegative = r.stars < 3 && (r.private_comment || "").trim().length > 0;
          const dt = r.created_at ? new Date(r.created_at) : null;
          return (
            <div
              key={r.id}
              data-testid={`review-row-${r.id}`}
              className={`rounded-xl border p-4 ${isNegative ? "border-red-500/50 bg-red-500/10" : "border-border bg-muted"}`}
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarsRow n={r.stars} />
                    <span className="text-sm text-foreground font-medium">{r.shop_name}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{r.discount_title}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    da <span className="text-foreground/80">{r.user_name || r.user_email}</span> · {dt?.toLocaleString("it-IT", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) || "-"}
                  </div>
                  {r.private_comment && (
                    <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${isNegative ? "bg-red-50 text-red-800 border border-red-500/40" : "bg-muted text-foreground/80"}`}>
                      "{r.private_comment}"
                    </div>
                  )}
                </div>
                {isNegative && r.merchant_phone && (
                  <a
                    data-testid={`review-wa-${r.id}`}
                    href={`https://wa.me/${(r.merchant_phone||"").replace(/[^0-9+]/g,"")}?text=${encodeURIComponent(`Ciao, sono l'amministratore di Sconti Roma. Un cliente ha lasciato un feedback importante sulla vostra offerta "${r.discount_title}". Possiamo parlarne?`)}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white"
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
