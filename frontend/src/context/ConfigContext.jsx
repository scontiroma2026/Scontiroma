import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

// Impostazioni pubbliche del server (GET /api/config/public), lette una volta all'avvio.
// subscriptionRequired=false: fase di lancio, l'app è gratuita per i clienti.
const ConfigContext = createContext({ loaded: false, subscriptionRequired: false });

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({ loaded: false, subscriptionRequired: false });

  useEffect(() => {
    api.get("/config/public")
      .then(({ data }) => setConfig({ loaded: true, subscriptionRequired: !!data.client_subscription_required }))
      .catch(() => setConfig({ loaded: true, subscriptionRequired: false }));
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export const useAppConfig = () => useContext(ConfigContext);
