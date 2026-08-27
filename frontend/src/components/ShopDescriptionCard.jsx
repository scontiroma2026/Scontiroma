import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Store, Save } from "lucide-react";
import { toast } from "sonner";

const MAX_LEN = 1500;

/**
 * Card nella MerchantDashboard: il commerciante racconta il proprio negozio
 * (stile Groupon "Il negozio"). Il testo appare nella pagina pubblica dello sconto.
 */
export default function ShopDescriptionCard() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => {
        const v = data.shop_description || data.user?.shop_description || "";
        setText(v);
        setSaved(v);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/merchants/me/profile", { shop_description: text.trim() });
      setSaved(text.trim());
      toast.success("Descrizione del negozio salvata! Sarà visibile sulla pagina della tua offerta.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const dirty = text.trim() !== saved;

  return (
    <Card data-testid="shop-description-card" className="border-white/10 bg-[#141414] p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
        <Store size={14} /> Il tuo negozio
      </div>
      <p className="mt-2 text-sm text-white/60">
        Racconta la tua attività ai clienti: storia, specialità, atmosfera. Questo testo apparirà
        nella sezione <strong className="text-white/80">"Il negozio"</strong> sulla pagina pubblica della tua offerta.
      </p>
      <Textarea
        data-testid="shop-description-input"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
        rows={5}
        placeholder="Es. Dal 1987 la nostra trattoria porta in tavola la vera cucina romana: carbonara mantecata al momento, cacio e pepe con pecorino DOP e un'atmosfera familiare nel cuore di Trastevere…"
        className="mt-4 bg-black/40 border-white/10 text-white"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-xs ${text.length > MAX_LEN - 100 ? "text-gold" : "text-white/40"}`}>
          {text.length}/{MAX_LEN}
        </span>
        <Button
          data-testid="shop-description-save"
          onClick={save}
          disabled={busy || !dirty}
          className="rounded-full grad-fucsia-viola text-white px-6"
        >
          <Save size={14} className="mr-2" /> {busy ? "Salvataggio…" : "Salva descrizione"}
        </Button>
      </div>
    </Card>
  );
}
