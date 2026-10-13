import { useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

/**
 * Modulo di segnalazione o reclamo. Il testo arriva nell'area admin → Segnalazioni; si risponde entro 5 giorni lavorativi.
 * `endpoint`: «/segnalazioni» (pubblico) o «/merchants/me/reclami» (commercianti).
 */
export default function SegnalaForm({ endpoint = "/segnalazioni", tipi, discountId, conEmail = true, onDone, testId = "segnala-form" }) {
  const [tipo, setTipo] = useState(tipi[0].valore);
  const [motivo, setMotivo] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const invia = async (e) => {
    e.preventDefault();
    if (motivo.trim().length < 10) {
      toast.error("Scrivi almeno 10 caratteri");
      return;
    }
    setBusy(true);
    try {
      const body = { tipo, motivo: motivo.trim(), discount_id: discountId || undefined, email: email.trim() || undefined };
      const r = await api.post(endpoint, body);
      toast.success(`Ricevuta. Ti confermiamo entro il ${new Date(`${r.data.conferma_entro}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}.`);
      setMotivo("");
      onDone?.();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={invia} data-testid={testId} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Di cosa si tratta?</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} data-testid={`${testId}-tipo`}
          className="w-full min-h-11 rounded-md border border-input bg-card px-3 py-2 text-sm">
          {tipi.map((t) => <option key={t.valore} value={t.valore}>{t.etichetta}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Racconta cosa è successo</span>
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={4} maxLength={1500} required
          data-testid={`${testId}-motivo`} className="w-full min-h-11 rounded-md border border-input bg-card px-3 py-2 text-sm" />
      </label>
      {conEmail && (
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">La tua email <span className="font-normal text-foreground">(facoltativa, per l'esito)</span></span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid={`${testId}-email`}
            className="w-full min-h-11 rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </label>
      )}
      <Button type="submit" disabled={busy} data-testid={`${testId}-invia`} className="min-h-11 rounded-full px-6">Invia</Button>
    </form>
  );
}
