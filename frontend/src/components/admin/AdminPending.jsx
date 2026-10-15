import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import RifiutoOffertaDialog from "@/components/admin/RifiutoOffertaDialog";

/**
 * Tab "Offerte in attesa": lista degli sconti pending con Approva / Rifiuta inline.
 * `hdrs` è la factory di headers admin master del parent. `onRefresh` ricarica i dati.
 */
export default function AdminPending({ pending, hdrs, onRefresh }) {
  const [q, setQ] = useState("");
  const [daRifiutare, setDaRifiutare] = useState(null);
  // Controllo foto: per ogni offerta, per ogni foto: «ok» (approvata) oppure il motivo dello scarto
  const [scelte, setScelte] = useState({});
  const [ingrandita, setIngrandita] = useState(null);
  const setScelta = (id, url, valore) =>
    setScelte((s) => {
      const per = { ...(s[id] || {}) };
      if (valore === null) delete per[url]; else per[url] = valore;
      return { ...s, [id]: per };
    });
  const scarta = (id, url) => {
    const motivo = (window.prompt("Perché scarti questa foto? (la legge il commerciante nell'email di pubblicazione, almeno 10 caratteri)", "") || "").trim();
    if (!motivo) return;
    if (motivo.length < 10) { toast.error("Serve un motivo di almeno 10 caratteri"); return; }
    setScelta(id, url, { scartata: motivo });
  };
  const approve = async (id) => {
    try {
      const foto_scartate = Object.entries(scelte[id] || {})
        .filter(([, v]) => v && v.scartata)
        .map(([url, v]) => ({ url, motivo: v.scartata }));
      await api.post(`/admin/discounts/${id}/approve`, foto_scartate.length ? { foto_scartate } : {}, hdrs());
      toast.success("Offerta approvata ✓");
      onRefresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const approvaTutte = async () => {
    const parola = window.prompt(
      `Stai per approvare TUTTE le ${pending.length} offerte in attesa e far partire la prova (circa due mesi) dei negozi alla prima pubblicazione.\n\nScrivi LANCIA per confermare:`, "");
    if (parola === null) return;
    try {
      const r = await api.post("/admin/discounts/approve-all-pending", { conferma: parola }, hdrs());
      toast.success(`Approvate ${r.data.approvate} offerte ✓` + (r.data.saltate_per_pagamento ? ` (${r.data.saltate_per_pagamento} saltate: pagamento non ricevuto)` : ""));
      onRefresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const reject = async (motivo) => {
    try {
      await api.post(`/admin/discounts/${daRifiutare.id}/reject`, { reason: motivo }, hdrs());
    } catch (err) {
      throw new Error(formatApiError(err));
    }
    setDaRifiutare(null);
    toast.success("Offerta rimandata in bozza");
    onRefresh();
  };

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? pending.filter((d) =>
        [d.title, d.description, d.merchant?.shop_name, d.merchant?.zone, d.category]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
    : pending;

  return (
    <Card className="border-border bg-muted p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">Offerte in attesa di approvazione</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Approva per pubblicare subito, o rifiuta per rimandare in bozza al commerciante.
          </p>
        </div>
        <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca negozio o offerta…" testId="pending-search" />
      </div>
      {pending.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4" data-testid="prelancio">
          <h4 className="font-serif text-lg">Pre-lancio</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Tieni le offerte in attesa fino al giorno del lancio, poi approvale tutte insieme: i negozi alla prima
            pubblicazione iniziano da quel momento la prova (circa due mesi, con pagamento il 1° del mese). Chiede di scrivere LANCIA per confermare.
          </p>
          <Button data-testid="approva-tutte" onClick={approvaTutte} className="mt-3 grad-fucsia-viola text-white">
            Approva tutte le {pending.length} offerte
          </Button>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-muted p-10 text-center text-muted-foreground">
          {q ? `Nessuna offerta trovata per "${q}".` : "🎉 Nessuna offerta in attesa. Ottimo lavoro!"}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              data-testid={`pending-${d.id}`}
              className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto] gap-4 rounded-xl border border-border bg-muted p-4"
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
                <div className="font-serif text-xl text-foreground mt-1">{d.title}</div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
                <div className="mt-2 flex items-baseline gap-2 text-sm">
                  <span className="text-fucsia font-bold text-lg">€{d.discounted_price?.toFixed(2)}</span>
                  <span className="text-muted-foreground line-through">€{d.original_price?.toFixed(2)}</span>
                  <span className="ml-2 text-neon text-xs">−{d.percent_off}%</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    data-testid={`pending-uses-${d.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-fucsia/40 bg-muted px-2.5 py-0.5 text-xs text-fucsia font-semibold"
                    title="Quante volte al mese ogni cliente può usare lo sconto"
                  >
                    🔁 {d.max_uses_per_month || 1}× al mese per cliente
                  </span>
                  {d.category && (
                    <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {d.category}
                    </span>
                  )}
                  {d.pagamento && !d.pagamento.ok && (
                    <span
                      data-testid={`pending-da-pagare-${d.id}`}
                      className="rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"
                      title={d.pagamento.motivo}
                    >
                      Pagamento non ricevuto
                    </span>
                  )}
                </div>
                {d.terms && <div className="mt-2 text-xs text-muted-foreground">Termini: {d.terms}</div>}
                {(d.image_urls || []).length > 0 && (
                  <div className="mt-3" data-testid={`foto-controllo-${d.id}`}>
                    <div className="text-xs font-semibold text-muted-foreground">
                      Foto dell'offerta ({d.image_urls.length}): tocca per ingrandire, poi approva o scarta ogni foto
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {d.image_urls.map((url, i) => {
                        const scelta = (scelte[d.id] || {})[url];
                        const scartata = scelta && scelta.scartata;
                        const ok = scelta && scelta.ok;
                        return (
                          <div key={url} data-testid={`foto-${d.id}-${i}`} className="flex flex-col gap-1.5">
                            <button type="button" onClick={() => setIngrandita(url)} aria-label={`Ingrandisci la foto ${i + 1}`}
                              className={`overflow-hidden rounded-lg border-2 ${scartata ? "border-destructive/60 opacity-50" : ok ? "border-green-600" : "border-border"}`}>
                              <img src={url} alt={`Foto ${i + 1}`} className="aspect-video w-full object-cover" loading="lazy" />
                            </button>
                            {scartata ? (
                              <>
                                <p className="text-xs text-destructive" data-testid={`foto-scartata-${d.id}-${i}`}>Scartata: {scelta.scartata}</p>
                                <Button type="button" size="sm" variant="outline" className="min-h-11 rounded-full" onClick={() => setScelta(d.id, url, null)}>Ripristina</Button>
                              </>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <Button type="button" size="sm" data-testid={`foto-approva-${d.id}-${i}`} variant={ok ? "default" : "outline"}
                                  className="min-h-11 w-full rounded-full" onClick={() => setScelta(d.id, url, { ok: true })}>
                                  <Check size={14} className="mr-1" /> Approva
                                </Button>
                                <Button type="button" size="sm" data-testid={`foto-scarta-${d.id}-${i}`} variant="outline"
                                  className="min-h-11 w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => scarta(d.id, url)}>
                                  <X size={14} className="mr-1" /> Scarta
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 md:justify-center">
                <Button
                  data-testid={`approve-${d.id}`}
                  onClick={() => approve(d.id)}
                  disabled={!!d.pagamento && !d.pagamento.ok}
                  title={d.pagamento && !d.pagamento.ok ? d.pagamento.motivo : undefined}
                  className="grad-fucsia-viola text-white rounded-full"
                >
                  <Check size={14} className="mr-1" /> Approva
                </Button>
                <Button
                  data-testid={`reject-${d.id}`}
                  onClick={() => setDaRifiutare({ id: d.id, titolo: d.title })}
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
      <Dialog open={!!ingrandita} onOpenChange={(o) => { if (!o) setIngrandita(null); }}>
        <DialogContent data-testid="foto-ingrandita" className="max-w-3xl bg-white p-3 text-ac-ink">
          <DialogHeader>
            <DialogTitle className="sr-only">Foto ingrandita</DialogTitle>
            <DialogDescription className="sr-only">Controlla la foto prima di approvarla o scartarla</DialogDescription>
          </DialogHeader>
          {ingrandita && <img src={ingrandita} alt="Foto ingrandita" className="max-h-[80vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
      <RifiutoOffertaDialog aperta={!!daRifiutare} titolo={daRifiutare?.titolo} onChiudi={() => setDaRifiutare(null)} onConferma={reject} />
    </Card>
  );
}
