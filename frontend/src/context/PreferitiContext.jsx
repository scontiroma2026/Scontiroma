import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/** Negozi preferiti del cliente (id dei commercianti), condivisi da elenco sconti e pagina offerta. */
const PreferitiContext = createContext({ ids: [], avvisi: false, attivo: false, cambia: async () => {}, impostaAvvisi: async () => {}, ricarica: async () => {} });

export function PreferitiProvider({ children }) {
  const { user } = useAuth();
  const attivo = Boolean(user && user.role === "client");
  const [ids, setIds] = useState([]);
  const [avvisi, setAvvisi] = useState(false);

  const ricarica = useCallback(async () => {
    if (!attivo) { setIds([]); setAvvisi(false); return null; }
    try {
      const { data } = await api.get("/me/preferiti");
      setIds(data.merchant_ids || []);
      setAvvisi(Boolean(data.avvisi));
      return data;
    } catch { return null; }
  }, [attivo]);

  useEffect(() => { ricarica(); }, [ricarica]);

  const cambia = useCallback(async (merchantId) => {
    if (!attivo) {
      toast.info("Accedi come cliente per salvare i tuoi negozi preferiti.");
      return;
    }
    const era = ids.includes(merchantId);
    setIds((v) => (era ? v.filter((x) => x !== merchantId) : [...v, merchantId]));
    try {
      if (era) await api.delete(`/me/preferiti/${merchantId}`);
      else await api.post(`/me/preferiti/${merchantId}`);
      toast.success(era ? "Tolto dai preferiti" : "Aggiunto ai preferiti");
    } catch (err) {
      setIds((v) => (era ? [...v, merchantId] : v.filter((x) => x !== merchantId)));
      toast.error(formatApiError(err));
    }
  }, [attivo, ids]);

  const impostaAvvisi = useCallback(async (valore) => {
    try {
      await api.put("/me/preferiti/avvisi", { attivo: valore });
      setAvvisi(valore);
      toast.success(valore ? "Fatto: ti scriviamo quando un tuo negozio preferito pubblica l'offerta." : "Non riceverai più questi avvisi.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  return (
    <PreferitiContext.Provider value={{ ids, avvisi, attivo, cambia, impostaAvvisi, ricarica }}>
      {children}
    </PreferitiContext.Provider>
  );
}

export const usePreferiti = () => useContext(PreferitiContext);
