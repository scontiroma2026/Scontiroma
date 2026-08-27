import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/StarRating";
import { Star } from "lucide-react";
import { toast } from "sonner";

export default function AdminAppFeedback({ hdrs }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/app-feedback", hdrs())
      .then((r) => setData(r.data))
      .catch((err) => toast.error(formatApiError(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <div className="text-white/60">Caricamento…</div>;

  return (
    <div data-testid="admin-app-feedback" className="space-y-6">
      <Card className="border-white/10 bg-white/5 p-6">
        <div className="text-xs uppercase tracking-wider text-gold">Valutazione media dell'app</div>
        <div className="mt-2 flex items-center gap-4">
          <span className="font-serif text-5xl text-white">{data.avg ?? "—"}</span>
          {data.avg && <StarRating avg={data.avg} count={data.count} size={20} />}
        </div>
        <div className="mt-1 text-sm text-white/50">{data.count} feedback ricevuti</div>
      </Card>
      <div className="space-y-3">
        {data.feedback.map((f) => (
          <Card key={f.id} data-testid={`feedback-row-${f.id}`} className="border-white/10 bg-[#141414] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={f.stars >= n ? "text-gold" : "text-white/20"} fill="currentColor" />
                ))}
              </div>
              <div className="text-xs text-white/40">
                {f.email} · {f.role} · {new Date(f.updated_at).toLocaleDateString("it-IT")}
              </div>
            </div>
            {f.comment && <p className="mt-2 text-sm text-white/75">{f.comment}</p>}
          </Card>
        ))}
        {data.feedback.length === 0 && <div className="text-white/50 text-sm">Nessun feedback ancora ricevuto.</div>}
      </div>
    </div>
  );
}
