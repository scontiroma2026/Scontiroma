import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/StarRating";
import { Star } from "lucide-react";
import { toast } from "sonner";
import AdminSearchInput from "@/components/admin/AdminSearchInput";

export default function AdminAppFeedback({ hdrs }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/admin/app-feedback", hdrs())
      .then((r) => setData(r.data))
      .catch((err) => toast.error(formatApiError(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <div className="text-muted-foreground">Caricamento…</div>;

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? data.feedback.filter((f) => [f.email, f.comment, f.role].filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
    : data.feedback;

  return (
    <div data-testid="admin-app-feedback" className="space-y-6">
      <Card className="border-border bg-muted p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-gold">Valutazione media dell'app</div>
            <div className="mt-2 flex items-center gap-4">
              <span className="font-serif text-5xl text-foreground">{data.avg ?? "—"}</span>
              {data.avg && <StarRating avg={data.avg} count={data.count} size={20} />}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{data.count} feedback ricevuti</div>
          </div>
          <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca email o commento…" testId="appfeedback-search" />
        </div>
      </Card>
      <div className="space-y-3">
        {filtered.map((f) => (
          <Card key={f.id} data-testid={`feedback-row-${f.id}`} className="border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={f.stars >= n ? "text-gold" : "text-muted-foreground"} fill="currentColor" />
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {f.email} · {f.role} · {new Date(f.updated_at).toLocaleDateString("it-IT")}
              </div>
            </div>
            {f.comment && <p className="mt-2 text-sm text-foreground/80">{f.comment}</p>}
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-muted-foreground text-sm">{q ? `Nessun feedback trovato per "${q}".` : "Nessun feedback ancora ricevuto."}</div>}
      </div>
    </div>
  );
}
