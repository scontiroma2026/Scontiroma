import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, Lock, AlertTriangle } from "lucide-react";

export default function MerchantDiscount() {
  const [form, setForm] = useState({
    title: "", description: "", original_price: "", discounted_price: "",
    image_url: "", terms: "", active: true,
  });
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const r = await api.get("/merchants/me/discount");
    const d = r.data.discount;
    if (d) {
      setExisting(d);
      setForm({
        title: d.title, description: d.description,
        original_price: d.original_price, discounted_price: d.discounted_price,
        image_url: d.image_url || "", terms: d.terms || "", active: d.active,
      });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        original_price: parseFloat(form.original_price),
        discounted_price: parseFloat(form.discounted_price),
      };
      if (isNaN(payload.original_price) || isNaN(payload.discounted_price)) {
        toast.error("Inserisci prezzi validi"); setLoading(false); return;
      }
      if (payload.discounted_price >= payload.original_price) {
        toast.error("Il prezzo scontato deve essere inferiore all'originale"); setLoading(false); return;
      }
      await api.post("/merchants/me/discount", payload);
      toast.success("Offerta inviata! Attende approvazione dell'amministratore.");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setLoading(false); }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const status = existing?.approval_status;
  const locked = existing?.locked_this_month;
  const readOnly = locked;

  return (
    <main data-testid="merchant-discount-page" className="mx-auto max-w-3xl px-6 py-12 text-white">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Il tuo sconto</div>
        <h1 className="mt-2 font-serif text-5xl">{existing ? "La tua offerta" : "Crea la tua offerta"}</h1>
      </div>

      {/* Status banner */}
      {status === "pending" && (
        <Card data-testid="banner-pending" className="mb-6 border-neon/40 bg-neon/10 p-5">
          <div className="flex items-start gap-3">
            <Clock className="text-neon shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta in fase di revisione</div>
              <p className="text-sm text-white/70 mt-1">
                Sarà attiva a breve dopo l'approvazione dell'amministratore. Nel frattempo puoi modificarla liberamente.
              </p>
            </div>
          </div>
        </Card>
      )}
      {status === "approved" && locked && (
        <Card data-testid="banner-locked" className="mb-6 border-fucsia/40 bg-fucsia/10 p-5">
          <div className="flex items-start gap-3">
            <Lock className="text-fucsia shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta attiva per questo mese</div>
              <p className="text-sm text-white/70 mt-1">
                Potrai inserire o modificare la nuova offerta a partire dal <strong className="text-fucsia">1° del mese prossimo</strong>. Se hai un errore grave, contatta l'amministratore per uno sblocco.
              </p>
            </div>
          </div>
        </Card>
      )}
      {status === "rejected" && (
        <Card data-testid="banner-rejected" className="mb-6 border-destructive/40 bg-destructive/10 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="text-destructive shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta rifiutata</div>
              <p className="text-sm text-white/70 mt-1">
                Modifica i dati e ri-invia per una nuova revisione.
                {existing?.approval_note && (
                  <span className="block mt-2 rounded-md bg-black/40 border border-white/10 p-2 text-white/80">
                    <strong className="text-destructive">Motivo:</strong> {existing.approval_note}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
      {status === "approved" && !locked && existing?.force_editable && (
        <Card data-testid="banner-override" className="mb-6 border-ciano/40 bg-ciano/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-ciano shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Sblocco amministratore</div>
              <p className="text-sm text-white/70 mt-1">L'amministratore ti ha concesso una modifica straordinaria. Salvando, l'offerta tornerà in revisione.</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5 p-8">
        <fieldset disabled={readOnly} className={readOnly ? "opacity-60" : ""}>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Titolo offerta</Label>
              <Input data-testid="disc-title" required value={form.title} onChange={upd("title")} className="mt-1 bg-black/40 border-white/10 text-white" placeholder="Es. Menu degustazione a metà prezzo" />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea data-testid="disc-description" required value={form.description} onChange={upd("description")} className="mt-1 bg-black/40 border-white/10 text-white" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prezzo originale (€)</Label>
                <Input data-testid="disc-original" type="number" step="0.01" required value={form.original_price} onChange={upd("original_price")} className="mt-1 bg-black/40 border-white/10 text-white" />
              </div>
              <div>
                <Label>Prezzo scontato (€)</Label>
                <Input data-testid="disc-discounted" type="number" step="0.01" required value={form.discounted_price} onChange={upd("discounted_price")} className="mt-1 bg-black/40 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label>URL immagine</Label>
              <Input data-testid="disc-image" value={form.image_url} onChange={upd("image_url")} className="mt-1 bg-black/40 border-white/10 text-white" placeholder="https://..." />
            </div>
            <div>
              <Label>Termini e condizioni</Label>
              <Textarea data-testid="disc-terms" value={form.terms} onChange={upd("terms")} className="mt-1 bg-black/40 border-white/10 text-white" rows={2} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-4">
              <div>
                <div className="font-medium text-white">Offerta attiva</div>
                <div className="text-xs text-white/60">Se disattivata, non appare nel catalogo</div>
              </div>
              <Switch data-testid="disc-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <Button data-testid="disc-submit" type="submit" disabled={loading || readOnly} size="lg" className="w-full grad-fucsia-viola text-white rounded-full py-6">
              {readOnly ? <><Lock size={16} className="mr-2" /> Modifiche bloccate questo mese</> :
                loading ? "Salvataggio…" :
                existing ? "Aggiorna e ri-invia in revisione" : "Pubblica (in revisione)"}
            </Button>
          </form>
        </fieldset>
      </Card>

      {status === "approved" && !locked && (
        <p className="mt-4 text-center text-xs text-white/50">
          <CheckCircle2 size={12} className="inline mr-1 text-fucsia" /> Offerta approvata e visibile agli utenti
        </p>
      )}
    </main>
  );
}
