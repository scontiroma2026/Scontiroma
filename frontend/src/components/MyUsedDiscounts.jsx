import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Sparkles, Loader2, TicketCheck } from "lucide-react";
import { toast } from "sonner";

function Stars({ value, onChange, readOnly, size = 22 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((i) => {
        const active = (hover || value) >= i;
        return (
          <button
            type="button"
            key={i}
            disabled={readOnly}
            data-testid={`star-${i}`}
            onMouseEnter={() => !readOnly && setHover(i)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(i)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition`}
          >
            <Star size={size} className={active ? "text-yellow-400 fill-yellow-400" : "text-white/25"} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Sezione asincrona nel profilo cliente: elenca gli sconti usati (redeemed) e
 * permette di lasciare una recensione (stelle + commento privato) una volta sola.
 */
export default function MyUsedDiscounts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({}); // {redemption_id: {stars, comment}}
  const [saving, setSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/redemptions/mine");
      setRows(data.redemptions || []);
    } catch (err) {
      console.warn("[my-used-discounts] load failed:", err?.message || err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (redemption_id) => {
    const d = drafts[redemption_id] || {};
    if (!d.stars) return toast.error("Seleziona un voto in stelle");
    setSaving(redemption_id);
    try {
      await api.post("/reviews", { redemption_id, stars: d.stars, comment: d.comment || "" });
      toast.success("Grazie del feedback!");
      await load();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setSaving(null); }
  };

  if (loading) return <div className="flex items-center gap-2 text-white/60"><Loader2 className="animate-spin" size={16}/> Caricamento…</div>;

  if (rows.length === 0) return (
    <Card className="border-warm bg-white/5 p-8 text-center text-white/60">
      <Sparkles className="mx-auto mb-2 text-fucsia" size={24}/>
      Non hai ancora usato nessuno sconto. Vai a <span className="text-fucsia">/discounts</span> e scoprine uno!
    </Card>
  );

  return (
    <div data-testid="my-used-discounts" className="space-y-3">
      {rows.map((r) => {
        const dt = r.redeemed_at ? new Date(r.redeemed_at) : null;
        const draft = drafts[r.id] || {};
        return (
          <Card key={r.id} data-testid={`used-${r.id}`} className="border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fucsia/20 text-fucsia shrink-0">
                <TicketCheck size={18}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-lg text-white">{r.discount_title}</div>
                <div className="text-xs text-white/60">{r.shop_name} · {dt ? dt.toLocaleDateString("it-IT",{day:"2-digit",month:"long",year:"numeric"}) : ""}</div>

                {r.reviewed ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
                    <span>Il tuo voto:</span>
                    <Stars value={r.stars} readOnly size={16}/>
                    <span className="text-xs text-white/50">— grazie del feedback!</span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/80">Come è andata?</span>
                      <Stars value={draft.stars || 0} onChange={(v) => setDrafts((d) => ({...d, [r.id]: {...d[r.id], stars: v}}))} />
                    </div>
                    <div>
                      <Textarea
                        data-testid={`comment-${r.id}`}
                        rows={2}
                        placeholder="Un commento privato (solo per l'amministratore)…"
                        maxLength={1000}
                        value={draft.comment || ""}
                        onChange={(e) => setDrafts((d) => ({...d, [r.id]: {...d[r.id], comment: e.target.value}}))}
                        className="bg-black/40 border-white/10 text-white text-sm"
                      />
                    </div>
                    <Button
                      data-testid={`submit-review-${r.id}`}
                      onClick={() => submit(r.id)}
                      disabled={saving === r.id || !draft.stars}
                      className="grad-fucsia-viola text-white rounded-full"
                      size="sm"
                    >
                      {saving === r.id ? "Invio…" : "Invia recensione"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
