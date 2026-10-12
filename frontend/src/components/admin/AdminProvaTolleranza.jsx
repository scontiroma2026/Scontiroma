import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Scheda, CLASSE_PRIMARIO } from "@/components/AreaUI";

/**
 * «Giorni di tolleranza» per il pagamento mensile dei negozi: se il negozio paga entro questi giorni
 * dal 1° l'offerta parte subito, altrimenti dal mese dopo. Nessun addebito: solo un'impostazione.
 */
export default function AdminProvaTolleranza({ hdrs }) {
  const [valore, setValore] = useState("");
  const [acceso, setAcceso] = useState(false);
  const [errore, setErrore] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const carica = useCallback(async () => {
    setErrore(false);
    try {
      const r = await api.get("/admin/impostazioni-pagamenti", hdrs ? hdrs() : undefined);
      setValore(String(r.data.giorni_tolleranza));
      setAcceso(!!r.data.interruttore_acceso);
    } catch (e) {
      setErrore(true);
    }
  }, [hdrs]);

  useEffect(() => { carica(); }, [carica]);

  const salva = async () => {
    const n = Number(valore);
    if (!Number.isInteger(n) || n < 0 || n > 31) {
      toast.error("Scrivi un numero intero da 0 a 31");
      return;
    }
    setSalvo(true);
    try {
      await api.put("/admin/impostazioni-pagamenti", { giorni_tolleranza: n }, hdrs ? hdrs() : undefined);
      toast.success("Giorni di tolleranza salvati");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSalvo(false);
    }
  };

  return (
    <Scheda titolo="Giorni di tolleranza per il pagamento" tono="teal" className="mb-4" data-testid="scheda-tolleranza">
      {errore ? (
        <p className="text-sm text-ac-soft">Non riesco a leggere l'impostazione. <button type="button" className="font-bold underline" onClick={carica}>Riprova</button></p>
      ) : (
        <>
          <p className="text-sm text-ac-soft">
            Se un negozio paga entro questi giorni dal 1° del mese, la sua offerta è visibile subito; oltre, dal mese dopo.
            Il blocco per mancato pagamento è{" "}
            <strong>{acceso ? "ACCESO" : "spento (nessun effetto sui clienti)"}</strong>.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-extrabold text-ac-soft">Giorni (0–31)</span>
              <input
                type="number" inputMode="numeric" min={0} max={31} value={valore}
                onChange={(e) => setValore(e.target.value)} data-testid="input-tolleranza"
                className="min-h-11 w-28 rounded-xl border border-ac-campo bg-white px-3 text-base text-ac-ink"
              />
            </label>
            <button type="button" onClick={salva} disabled={salvo} data-testid="salva-tolleranza" className={CLASSE_PRIMARIO}>
              Salva
            </button>
          </div>
        </>
      )}
    </Scheda>
  );
}
