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

// Fonte della campagna (es. volantino-garbatella): stessa regola dei 30 giorni, solo lettere minuscole, numeri e trattini.
const K_FONTE = "fonte_iscrizione";
const K_FONTE_TS = "fonte_iscrizione_at";
const RE_FONTE = /^[a-z0-9-]{1,40}$/;

export function salvaFonte(valore) {
  const f = (valore || "").trim().toLowerCase();
  if (!RE_FONTE.test(f)) return;
  try {
    localStorage.setItem(K_FONTE, f);
    localStorage.setItem(K_FONTE_TS, new Date().toISOString());
  } catch (_) { /* localStorage non disponibile (scheda privata) */ }
}

export function leggiFonte() {
  try {
    const f = localStorage.getItem(K_FONTE);
    if (!f || !RE_FONTE.test(f)) return null;
    const quando = Date.parse(localStorage.getItem(K_FONTE_TS) || "");
    if (quando && Date.now() - quando > GIORNI * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(K_FONTE); localStorage.removeItem(K_FONTE_TS);
      return null;
    }
    return f;
  } catch (_) {
    return null;
  }
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

// Conta in modo anonimo una visita arrivata da un volantino o un QR con «?fonte=»: al massimo una volta al giorno per
// questo telefono e questa fonte. Al server vanno solo la fonte e il tipo di pagina, mai dati personali.
export function registraVisitaFonte(valore, tipo, inviaVisita) {
  const f = (valore || "").trim().toLowerCase();
  if (!RE_FONTE.test(f)) return;
  try {
    const chiave = `fonte_visita_${tipo}_${f}`;
    const oggi = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(chiave) === oggi) return;
    localStorage.setItem(chiave, oggi);
  } catch (_) { /* senza localStorage si conta una visita in più: va bene */ }
  inviaVisita(f, tipo);
}
