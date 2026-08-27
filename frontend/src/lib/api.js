import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// withCredentials: invia SEMPRE i cookie httpOnly (access_token, refresh_token,
// admin_master_token) impostati dal backend. Nessun token è mai leggibile da
// JavaScript → immune a XSS. localStorage NON contiene credenziali.
const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Cleanup legacy: rimuove eventuali token salvati in localStorage da versioni
// precedenti dell'app. L'auth (inclusa la master admin) passa SOLO via cookie httpOnly.
try {
  if (typeof window !== "undefined") {
    ["access_token", "admin_master_token"].forEach((k) => {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    });
  }
} catch (_) {
  /* localStorage disabilitato (es. Safari private) — nessun impatto: usiamo solo cookie */
}

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
