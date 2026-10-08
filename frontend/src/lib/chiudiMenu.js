// Menu a tendina nativi (<select>): su iPhone/Safari, se l'elemento resta "attivo" dopo la scelta,
// il selettore può restare aperto o riaprirsi alla successiva modifica della pagina (per esempio
// quando arrivano i risultati filtrati). Dopo ogni scelta togliamo il focus dall'elemento, così il
// menu si chiude sempre. Vale per tutti i <select> dell'app, presenti e futuri, senza cambiarne l'aspetto.
export function chiudiMenuDopoLaScelta() {
  if (typeof document === "undefined" || window.__chiudiMenuAttivo) return;
  window.__chiudiMenuAttivo = true;
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!el || el.tagName !== "SELECT") return;
    // Dopo che React ha applicato il valore (un solo giro di disegno), poi blur
    window.requestAnimationFrame(() => {
      try { el.blur(); } catch (_) { /* elemento già rimosso */ }
    });
  }, true);
}
