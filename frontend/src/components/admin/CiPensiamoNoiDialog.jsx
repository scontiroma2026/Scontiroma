import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PhotoGallery from "@/components/PhotoGallery";

const VUOTO = {
  title: "", description: "", original_price: "", discounted_price: "", image_urls: [],
  validity_info: "", terms: "", plan_ahead: "", additional_info: "", max_uses_per_month: 1,
};
const CAMPO = "mt-1 bg-white border-border text-foreground";

/**
 * «Ci pensiamo noi»: l'admin inserisce l'offerta per conto del negozio (servizio gratuito).
 * Stessi campi del modulo del commerciante. Salvando, l'offerta resta «in attesa di conferma del negozio»
 * (non visibile ai clienti, la prova non parte) e il negozio riceve l'email con «Confermo» / «Voglio modificarla».
 */
export default function CiPensiamoNoiDialog({ merchant, hdrs, onChiudi, onSalvata }) {
  const [form, setForm] = useState(VUOTO);
  const [stato, setStato] = useState({ carica: true, ok: true, motivo: "", inviata_at: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let annullato = false;
    api.get(`/admin/merchants/${merchant.id}/ci-pensiamo-noi`, hdrs())
      .then(({ data }) => {
        if (annullato) return;
        setStato({ carica: false, ok: data.ok, motivo: data.motivo, inviata_at: data.inviata_at });
        if (data.offerta) setForm({ ...VUOTO, ...Object.fromEntries(Object.entries(data.offerta).filter(([, v]) => v != null)) });
      })
      .catch((e) => { if (!annullato) { setStato({ carica: false, ok: false, motivo: formatApiError(e) }); } });
    return () => { annullato = true; };
    // solo all'apertura: `hdrs` cambia a ogni render del pannello e ricaricare cancellerebbe ciò che si sta scrivendo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant.id]);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const salva = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      original_price: parseFloat(String(form.original_price).replace(",", ".")),
      discounted_price: parseFloat(String(form.discounted_price).replace(",", ".")),
      max_uses_per_month: parseInt(form.max_uses_per_month, 10) || 1,
      image_url: form.image_urls[0] || "",
      active: true,
    };
    delete payload.percent_off;
    if (isNaN(payload.original_price) || isNaN(payload.discounted_price) || payload.discounted_price >= payload.original_price) {
      toast.error("Verifica i prezzi (scontato più basso del pieno)");
      return;
    }
    if (!window.confirm(`Salvare l'offerta e mandare l'email di conferma a ${merchant.shop_name}?\n\nNon sarà visibile ai clienti finché il negozio non la conferma e tu non la approvi.`)) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/merchants/${merchant.id}/ci-pensiamo-noi`, payload, hdrs());
      if (data.email_inviata) toast.success("Offerta salvata: email di conferma inviata al negozio.");
      else toast.warning("Offerta salvata, ma l'email non è partita: controlla Resend o riprova.");
      onSalvata?.();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onChiudi}>
      <div data-testid="cpn-dialog" role="dialog" aria-modal="true" aria-labelledby="cpn-titolo"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-ciano">Ci pensiamo noi · gratuito</div>
            <h3 id="cpn-titolo" className="font-serif text-2xl text-foreground">{merchant.shop_name}</h3>
          </div>
          <button type="button" onClick={onChiudi} aria-label="Chiudi" className="min-h-11 min-w-11 rounded-md bg-muted p-2 text-foreground"><X size={16} /></button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Inserisci l'offerta come la vuole il negozio. Resta <strong>in attesa di conferma del negozio</strong>: non si vede ai clienti
          e la prova non parte. Il negozio riceve un'email con il riepilogo e i pulsanti «Confermo» (link valido 7 giorni) e «Voglio modificarla».
          {stato.inviata_at && <> Email già mandata il {new Date(stato.inviata_at).toLocaleString("it-IT")}: salvando ne parte una nuova e il link vecchio non vale più.</>}
        </p>

        {stato.carica ? (
          <p className="text-sm text-muted-foreground" role="status">Caricamento…</p>
        ) : !stato.ok ? (
          <p data-testid="cpn-non-possibile" className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-foreground">{stato.motivo}</p>
        ) : (
          <form onSubmit={salva} className="space-y-4">
            <div>
              <Label htmlFor="cpn-title" className="text-xs text-muted-foreground">Titolo offerta</Label>
              <Input id="cpn-title" data-testid="cpn-title" required value={form.title} onChange={upd("title")} className={CAMPO} />
            </div>
            <div>
              <Label htmlFor="cpn-description" className="text-xs text-muted-foreground">Descrizione</Label>
              <Textarea id="cpn-description" data-testid="cpn-description" required rows={3} value={form.description} onChange={upd("description")} className={CAMPO} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cpn-original" className="text-xs text-muted-foreground">Prezzo pieno (€)</Label>
                <Input id="cpn-original" data-testid="cpn-original" type="number" inputMode="decimal" step="0.01" required value={form.original_price} onChange={upd("original_price")} className={CAMPO} />
              </div>
              <div>
                <Label htmlFor="cpn-discounted" className="text-xs text-muted-foreground">Prezzo scontato (€)</Label>
                <Input id="cpn-discounted" data-testid="cpn-discounted" type="number" inputMode="decimal" step="0.01" required value={form.discounted_price} onChange={upd("discounted_price")} className={CAMPO} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Foto (fino a 8, la prima è la copertina): dal telefono o dalla libreria</div>
              <div className="mt-2">
                <PhotoGallery value={form.image_urls} onChange={(urls) => setForm((f) => ({ ...f, image_urls: urls }))} max={8} category={merchant.category || ""} />
              </div>
            </div>
            <div>
              <Label htmlFor="cpn-validity" className="text-xs text-muted-foreground">Giorni e orari in cui vale</Label>
              <Textarea id="cpn-validity" data-testid="cpn-validity" rows={2} value={form.validity_info} onChange={upd("validity_info")} className={CAMPO} placeholder="Es. Da lunedì a venerdì, 12-15" />
            </div>
            <div>
              <Label htmlFor="cpn-terms" className="text-xs text-muted-foreground">Condizioni</Label>
              <Textarea id="cpn-terms" rows={2} value={form.terms} onChange={upd("terms")} className={CAMPO} />
            </div>
            <div>
              <Label htmlFor="cpn-plan" className="text-xs text-muted-foreground">Prenotazione / pianifica in anticipo</Label>
              <Textarea id="cpn-plan" rows={2} value={form.plan_ahead} onChange={upd("plan_ahead")} className={CAMPO} />
            </div>
            <div>
              <Label htmlFor="cpn-extra" className="text-xs text-muted-foreground">Informazioni aggiuntive</Label>
              <Textarea id="cpn-extra" rows={2} value={form.additional_info} onChange={upd("additional_info")} className={CAMPO} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Utilizzi al mese per cliente</div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {[1, 2, 3, 5, 10].map((n) => (
                  <button key={n} type="button" data-testid={`cpn-uses-${n}`} aria-pressed={Number(form.max_uses_per_month) === n}
                    onClick={() => setForm((f) => ({ ...f, max_uses_per_month: n }))}
                    className={`min-h-11 rounded-xl border-2 text-sm font-bold ${Number(form.max_uses_per_month) === n ? "border-fucsia bg-fucsia text-white" : "border-border bg-white text-foreground"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" data-testid="cpn-salva" disabled={busy}
              className="min-h-12 w-full rounded-full grad-fucsia-viola px-5 font-semibold text-white disabled:opacity-60">
              {busy ? "Salvataggio…" : "Salva e manda l'email di conferma"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
