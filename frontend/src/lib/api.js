import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// withCredentials: invia SEMPRE i cookie httpOnly (access_token, refresh_token)
// impostati dal backend al login. Il JWT NON è mai leggibile da JS → immune a XSS.
const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Cleanup legacy: se un utente ha ancora `access_token` in localStorage da
// versioni precedenti dell'app, lo rimuoviamo al primo boot. Non lo leggiamo
// più — l'auth passa solo via cookie httpOnly.
try {
  if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
    localStorage.removeItem("access_token");
  }
} catch (_) {
  /* localStorage disabled — non è un problema */
}

// Header X-Admin-Master: token master di sessione admin (NON un JWT auth).
// Verrà anch'esso migrato a cookie httpOnly (`admin_master_token` esiste già
// lato backend), ma per ora lo teniamo come fallback fino al prossimo giro.
api.interceptors.request.use((config) => {
  const master = localStorage.getItem("admin_master_token");
  if (master) {
    config.headers = config.headers || {};
    if (!config.headers["X-Admin-Master"]) config.headers["X-Admin-Master"] = master;
  }
  return config;
});

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Errore imprevisto";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default api;
