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
    if (d.approval_status === "rejected") return <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-700 px-2 py-0.5 text-xs"><X size={10}/> Rifiutato</span>;
    if (d.approval_status === "pending") return <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-amber-800 px-2 py-0.5 text-xs"><Clock size={10}/> In revisione</span>;
    if (d.approval_status === "approved" && d.active) return <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 text-emerald-700 px-2 py-0.5 text-xs"><Check size={10}/> Attivo</span>;
    return <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted text-muted-foreground px-2 py-0.5 text-xs">Storico</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="merchant-discounts-dialog" className="max-w-4xl max-h-[85vh] overflow-hidden bg-card border-border text-foreground flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">
            {m ? m.shop_name : "Caricamento…"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Storico offerte + dati commerciante
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex-1 flex items-center justify-center py-12"><Loader2 className="animate-spin text-fucsia" size={28}/></div>
        )}

        {m && !loading && (
          <>
            {/* Dati commerciante */}
            <div className="rounded-xl border border-border bg-muted p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-xs uppercase text-muted-foreground">Referente</div><div className="text-foreground">{m.name}</div></div>
              <div><div className="text-xs uppercase text-muted-foreground">Email</div><div className="text-foreground truncate">{m.email}</div></div>
              <div><div className="text-xs uppercase text-muted-foreground">Zona</div><div className="text-foreground">{m.zone}</div></div>
              <div><div className="text-xs uppercase text-muted-foreground">Categoria</div><div className="text-foreground">{m.category}</div></div>
              <div className="col-span-2">
                <div className="text-xs uppercase text-muted-foreground">Telefono</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground font-mono">{m.phone || <span className="text-muted-foreground">non disponibile</span>}</span>
                  {m.phone && (
                    <a
                      data-testid="merchant-wa-link"
                      href={`https://wa.me/${(m.phone||"").replace(/[^0-9+]/g,"")}?text=${encodeURIComponent(`Ciao ${m.name || "commerciante"}, ti scrivo da Sconti Roma...`)}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 px-3 py-1 text-xs font-medium text-white"
                    >
                      <Phone size={10}/> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs uppercase text-muted-foreground">Indirizzo</div>
                <div className="text-foreground">{m.address || <span className="text-muted-foreground">non impostato</span>}</div>
              </div>
            </div>

            {/* Lista offerte */}
            <div className="flex-1 overflow-y-auto pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History size={16} className="text-ciano"/>
                <div className="text-sm text-foreground/80">Offerte ({discounts.length})</div>
              </div>
              {discounts.length === 0 && <div className="text-muted-foreground text-sm">Nessuna offerta trovata.</div>}
              <div className="space-y-2">
                {discounts.map((d) => (
                  <div key={d.id} data-testid={`disc-row-${d.id}`} className="rounded-xl border border-border bg-muted p-3 flex items-center gap-4">
                    {d.image_url && <img src={d.image_url} alt="" className="h-16 w-24 object-cover rounded-lg"/>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium text-foreground truncate">{d.title}</div>
                        {statusPill(d)}
                        {d.locked_month && <span className="text-xs text-muted-foreground font-mono">🔒 {d.locked_month}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{d.description}</div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>€ {Number(d.original_price||0).toFixed(2)} → <span className="text-fucsia font-semibold">€ {Number(d.discounted_price||0).toFixed(2)}</span></span>
                        <span>· {d.redemptions_count} redemption</span>
                        <span
                          data-testid={`disc-uses-${d.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-fucsia/40 bg-fucsia/10 px-2 py-0.5 text-[10px] text-fucsia font-semibold"
                          title="Utilizzi al mese per cliente"
                        >
                          🔁 {d.max_uses_per_month || 1}× / mese
                        </span>
                        {d.approval_note && <span className="text-red-700">· {d.approval_note}</span>}
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
