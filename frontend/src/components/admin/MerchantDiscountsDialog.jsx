import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, History, Check, Clock, X, Phone } from "lucide-react";

/**
 * Dialog che mostra tutte le offerte di un commerciante (attive + storico + rifiutate).
 * Include il numero di telefono con link WhatsApp.
 */
export default function MerchantDiscountsDialog({ merchantId, open, onOpenChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !merchantId) return;
    setLoading(true);
    api.get(`/admin/merchants/${merchantId}/discounts`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [open, merchantId]);

  const m = data?.merchant;
  const discounts = data?.discounts || [];

  const statusPill = (d) => {
    if (d.approval_status === "rejected") return <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-300 px-2 py-0.5 text-xs"><X size={10}/> Rifiutato</span>;
    if (d.approval_status === "pending") return <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 px-2 py-0.5 text-xs"><Clock size={10}/> In revisione</span>;
    if (d.approval_status === "approved" && d.active) return <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 text-green-300 px-2 py-0.5 text-xs"><Check size={10}/> Attivo</span>;
    return <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 text-white/70 px-2 py-0.5 text-xs">Storico</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="merchant-discounts-dialog" className="max-w-4xl max-h-[85vh] overflow-hidden bg-zinc-950 border-white/10 text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-white">
            {m ? m.shop_name : "Caricamento…"}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Storico offerte + dati commerciante
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex-1 flex items-center justify-center py-12"><Loader2 className="animate-spin text-fucsia" size={28}/></div>
        )}

        {m && !loading && (
          <>
            {/* Dati commerciante */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-xs uppercase text-white/40">Referente</div><div className="text-white">{m.name}</div></div>
              <div><div className="text-xs uppercase text-white/40">Email</div><div className="text-white/90 truncate">{m.email}</div></div>
              <div><div className="text-xs uppercase text-white/40">Zona</div><div className="text-white">{m.zone}</div></div>
              <div><div className="text-xs uppercase text-white/40">Categoria</div><div className="text-white">{m.category}</div></div>
              <div className="col-span-2">
                <div className="text-xs uppercase text-white/40">Telefono</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-mono">{m.phone || <span className="text-white/40">non disponibile</span>}</span>
                  {m.phone && (
                    <a
                      data-testid="merchant-wa-link"
                      href={`https://wa.me/${(m.phone||"").replace(/[^0-9+]/g,"")}?text=${encodeURIComponent(`Ciao ${m.name || "commerciante"}, ti scrivo da Sconti Roma...`)}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-green-500 hover:bg-green-400 px-3 py-1 text-xs font-medium text-white"
                    >
                      <Phone size={10}/> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs uppercase text-white/40">Indirizzo</div>
                <div className="text-white/90">{m.address || <span className="text-white/40">non impostato</span>}</div>
              </div>
            </div>

            {/* Lista offerte */}
            <div className="flex-1 overflow-y-auto pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History size={16} className="text-ciano"/>
                <div className="text-sm text-white/80">Offerte ({discounts.length})</div>
              </div>
              {discounts.length === 0 && <div className="text-white/50 text-sm">Nessuna offerta trovata.</div>}
              <div className="space-y-2">
                {discounts.map((d) => (
                  <div key={d.id} data-testid={`disc-row-${d.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-4">
                    {d.image_url && <img src={d.image_url} alt="" className="h-16 w-24 object-cover rounded-lg"/>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium text-white truncate">{d.title}</div>
                        {statusPill(d)}
                        {d.locked_month && <span className="text-xs text-white/40 font-mono">🔒 {d.locked_month}</span>}
                      </div>
                      <div className="text-xs text-white/60 mt-1 line-clamp-1">{d.description}</div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-white/70 flex-wrap">
                        <span>€ {Number(d.original_price||0).toFixed(2)} → <span className="text-fucsia font-semibold">€ {Number(d.discounted_price||0).toFixed(2)}</span></span>
                        <span>· {d.redemptions_count} redemption</span>
                        <span
                          data-testid={`disc-uses-${d.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-fucsia/40 bg-fucsia/10 px-2 py-0.5 text-[10px] text-fucsia font-semibold"
                          title="Utilizzi al mese per abbonato"
                        >
                          🔁 {d.max_uses_per_month || 1}× / mese
                        </span>
                        {d.approval_note && <span className="text-red-300">· {d.approval_note}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
