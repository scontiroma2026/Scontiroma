import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function MerchantDiscount() {
  const [form, setForm] = useState({
    title: "", description: "", original_price: "", discounted_price: "",
    image_url: "", terms: "", active: true,
  });
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    api.get("/merchants/me/discount").then((r) => {
      const d = r.data.discount;
      if (d) {
        setExisting(true);
        setForm({
          title: d.title, description: d.description,
          original_price: d.original_price, discounted_price: d.discounted_price,
          image_url: d.image_url || "", terms: d.terms || "", active: d.active,
        });
      }
    });
  }, []);

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
        toast.error("Inserisci prezzi validi");
        setLoading(false);
        return;
      }
      if (payload.discounted_price >= payload.original_price) {
        toast.error("Il prezzo scontato deve essere inferiore all'originale");
        setLoading(false);
        return;
      }
      await api.post("/merchants/me/discount", payload);
      toast.success(existing ? "Offerta aggiornata" : "Offerta pubblicata!");
      setExisting(true);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <main data-testid="merchant-discount-page" className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Il tuo sconto</div>
        <h1 className="mt-2 font-serif text-5xl">{existing ? "Modifica offerta" : "Crea la tua offerta"}</h1>
        <p className="mt-2 text-espresso/70">Un solo sconto per commerciante. Sceglilo bene: sarà la tua vetrina.</p>
      </div>

      <Card className="border-warm bg-white p-8">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label>Titolo offerta</Label>
            <Input data-testid="disc-title" required value={form.title} onChange={upd("title")} className="mt-1" placeholder="Es. Menu degustazione a metà prezzo" />
          </div>
          <div>
            <Label>Descrizione</Label>
            <Textarea data-testid="disc-description" required value={form.description} onChange={upd("description")} className="mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prezzo originale (€)</Label>
              <Input data-testid="disc-original" type="number" step="0.01" required value={form.original_price} onChange={upd("original_price")} className="mt-1" />
            </div>
            <div>
              <Label>Prezzo scontato (€)</Label>
              <Input data-testid="disc-discounted" type="number" step="0.01" required value={form.discounted_price} onChange={upd("discounted_price")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>URL immagine</Label>
            <Input data-testid="disc-image" value={form.image_url} onChange={upd("image_url")} className="mt-1" placeholder="https://..." />
          </div>
          <div>
            <Label>Termini e condizioni</Label>
            <Textarea data-testid="disc-terms" value={form.terms} onChange={upd("terms")} className="mt-1" rows={2} placeholder="Es. Valido dal lunedì al giovedì" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-warm bg-parchment p-4">
            <div>
              <div className="font-medium text-espresso">Offerta attiva</div>
              <div className="text-xs text-espresso/60">Se disattivata, non appare nel catalogo</div>
            </div>
            <Switch
              data-testid="disc-active"
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>
          <Button data-testid="disc-submit" type="submit" disabled={loading} size="lg" className="w-full bg-terracotta text-white hover:bg-terracotta/90">
            {loading ? "Salvataggio…" : existing ? "Aggiorna offerta" : "Pubblica offerta"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
