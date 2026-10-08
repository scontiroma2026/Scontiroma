import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Store, Save } from "lucide-react";
import { toast } from "sonner";
import { Scheda, CLASSE_PRIMARIO } from "@/components/AreaUI";

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
    <Scheda data-testid="shop-description-card" titolo="Il tuo negozio" tono="rosa" icona={<Store size={15} />}>
      <p className="text-sm leading-relaxed text-ac-soft">
        Racconta la tua attività ai clienti: storia, specialità, atmosfera. Questo testo apparirà
        nella sezione <strong className="text-ac-ink">"Il negozio"</strong> sulla pagina pubblica della tua offerta.
      </p>
      <label htmlFor="shop-description" className="sr-only">Descrizione del negozio</label>
      <Textarea
        id="shop-description"
        data-testid="shop-description-input"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
        rows={5}
        placeholder="Es. Dal 1987 la nostra trattoria porta in tavola la vera cucina romana: carbonara mantecata al momento, cacio e pepe con pecorino DOP e un'atmosfera familiare nel cuore di Trastevere…"
        className="mt-4 rounded-xl border-ac-campo bg-white text-base text-ac-ink"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs font-bold ${text.length > MAX_LEN - 100 ? "text-ac-ambra" : "text-ac-mute"}`}>
          {text.length}/{MAX_LEN}
        </span>
        <button
          type="button"
          data-testid="shop-description-save"
          onClick={save}
          disabled={busy || !dirty}
          className={`${CLASSE_PRIMARIO} min-h-12 px-6 text-sm`}
        >
          <Save size={16} aria-hidden="true" /> {busy ? "Salvataggio…" : "Salva descrizione"}
        </button>
      </div>
    </Scheda>
  );
}
