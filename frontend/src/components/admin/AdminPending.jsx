import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Tab "Offerte in attesa": lista degli sconti pending con Approva / Rifiuta inline.
 * `hdrs` è la factory di headers admin master del parent. `onRefresh` ricarica i dati.
 */
export default function AdminPending({ pending, hdrs, onRefresh }) {
  const approve = async (id) => {
    try {
      await api.post(`/admin/discounts/${id}/approve`, {}, hdrs());
      toast.success("Offerta approvata ✓");
      onRefresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Motivo del rifiuto (visibile al commerciante):", "") || "";
    try {
      await api.post(`/admin/discounts/${id}/reject`, { reason }, hdrs());
      toast.success("Offerta rimandata in bozza");
      onRefresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <Card className="border-white/10 bg-white/5 p-6">
      <h3 className="font-serif text-2xl">Offerte in attesa di approvazione</h3>
      <p className="text-xs text-white/50 mt-1">
        Approva per pubblicare subito, o rifiuta per rimandare in bozza al commerciante.
      </p>
      {pending.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-10 text-center text-white/60">
          🎉 Nessuna offerta in attesa. Ottimo lavoro!
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {pending.map((d) => (
            <div
              key={d.id}
              data-testid={`pending-${d.id}`}
              className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto] gap-4 rounded-xl border border-white/10 bg-black/30 p-4"
            >
              <img
                src={d.image_url || d.merchant?.image_url}
                alt=""
                className="h-24 w-24 rounded-lg object-cover"
              />
              <div>
                <div className="text-xs uppercase tracking-wider text-ciano">
                  {d.merchant?.shop_name} · {d.merchant?.zone}
                </div>
                <div className="font-serif text-xl text-white mt-1">{d.title}</div>
                <p className="text-sm text-white/70 mt-1 line-clamp-2">{d.description}</p>
                <div className="mt-2 flex items-baseline gap-2 text-sm">
                  <span className="text-fucsia font-bold text-lg">€{d.discounted_price?.toFixed(2)}</span>
                  <span className="text-white/40 line-through">€{d.original_price?.toFixed(2)}</span>
                  <span className="ml-2 text-neon text-xs">−{d.percent_off}%</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    data-testid={`pending-uses-${d.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-fucsia/40 bg-fucsia/10 px-2.5 py-0.5 text-xs text-fucsia font-semibold"
                    title="Quante volte al mese ogni abbonato può usare lo sconto"
                  >
                    🔁 {d.max_uses_per_month || 1}× al mese per abbonato
                  </span>
                  {d.category && (
                    <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-xs text-white/70">
                      {d.category}
                    </span>
                  )}
                </div>
                {d.terms && <div className="mt-2 text-xs text-white/50">Termini: {d.terms}</div>}
              </div>
              <div className="flex flex-col gap-2 md:justify-center">
                <Button
                  data-testid={`approve-${d.id}`}
                  onClick={() => approve(d.id)}
                  className="grad-fucsia-viola text-white rounded-full"
                >
                  <Check size={14} className="mr-1" /> Approva
                </Button>
                <Button
                  data-testid={`reject-${d.id}`}
                  onClick={() => reject(d.id)}
                  variant="outline"
                  className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <X size={14} className="mr-1" /> Rifiuta
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
