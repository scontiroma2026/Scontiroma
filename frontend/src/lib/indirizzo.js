// Numero civico scritto dall'utente (es. "12", "12b", "12/A"), escluso il CAP a 5 cifre.
// Si prende l'ultimo numero della parte prima della virgola: "Via dell'Esempio 12, 00154 Roma" → "12".
export function civicoDigitato(testo) {
  const via = String(testo || "").split(",")[0];
  const trovati = via.match(/\b\d{1,4}(?:\s?[a-zA-Z](?![a-zA-Z]))?(?:\/[a-zA-Z0-9]{1,3})?\b/g);
  return trovati ? trovati[trovati.length - 1].replace(/\s+/g, "") : "";
}

// Suggerimento senza civico + civico scritto dall'utente: si tiene il civico.
export function conCivico(s, civico) {
  if (s.has_house_number || !civico || !s.road) return s;
  const citta = `${s.postcode || ""} ${s.city || ""}`.trim();
  const display = [`${s.road} ${civico}`, citta].filter(Boolean).join(", ");
  return { ...s, display, house_number: civico, civico_digitato: true };
}
