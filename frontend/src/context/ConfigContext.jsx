import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

// Impostazioni pubbliche del server (GET /api/config/public), lette una volta all'avvio.
// subscriptionRequired=false: fase di lancio, l'app è gratuita per i clienti.
const ConfigContext = createContext({ loaded: false, subscriptionRequired: false, aiEnhance: false, prelaunch: false, sconticini: false });

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({ loaded: false, subscriptionRequired: false, aiEnhance: false, prelaunch: false, sconticini: false });

  useEffect(() => {
    api.get("/config/public")
      .then(({ data }) => setConfig({
        loaded: true,
        subscriptionRequired: !!data.client_subscription_required,
        // «Migliora foto»: il pulsante c'è solo se il server ha la chiave Gemini
        aiEnhance: !!data.ai_enhance_enabled,
        // Data di fine prova dei commercianti: c'è solo se impostata su Render (TRIAL_END_DATE)
        trialEndLabel: data.trial_end_label || null,
        // Pre-lancio (PRELAUNCH_MODE su Render): home e catalogo vuoto mostrano «Stiamo arrivando» con la lista d'attesa
        prelaunch: !!data.prelaunch_mode,
        // Sconticini (SCONTICINI_ENABLED su Render, spento di default): tessere, impostazioni del negozio e regolamento
        sconticini: !!data.sconticini_enabled,
      }))
      .catch(() => setConfig({ loaded: true, subscriptionRequired: false, aiEnhance: false, prelaunch: false, sconticini: false }));
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export const useAppConfig = () => useContext(ConfigContext);
