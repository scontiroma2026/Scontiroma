// Negozio da cui arriva chi si iscrive (QR della locandina o link del negozio).
// Si ricorda per 30 giorni, anche se il cliente prima guarda gli sconti e si iscrive dopo.
const K_ID = "referral_merchant_id";
const K_TS = "referral_captured_at";
const GIORNI = 30;

export function salvaReferral(id) {
  if (!id) return;
  try {
    localStorage.setItem(K_ID, id);
    localStorage.setItem(K_TS, new Date().toISOString());
  } catch (_) { /* localStorage non disponibile (scheda privata) */ }
}

export function leggiReferral() {
  try {
    const id = localStorage.getItem(K_ID);
    if (!id) return null;
    const quando = Date.parse(localStorage.getItem(K_TS) || "");
    if (quando && Date.now() - quando > GIORNI * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(K_ID); localStorage.removeItem(K_TS);
      return null;
    }
    return id;
  } catch (_) {
    return null;
  }
}
