// Durata dell'offerta: la sceglie il negozio (decisione del titolare, 14/11). Non vale più «fino a fine mese».
// I numeri massimi arrivano dal server (/api/config/public → offer_duration); questi sono solo i valori di
// riserva se la risposta non c'è ancora.

export const DURATA_PREDEFINITA = 30;
export const MAX_SCONTO = 90;
export const MAX_OMAGGIO = 365;

// Scelte rapide del modulo (giorni dal giorno in cui l'offerta va online)
export const DURATE_RAPIDE = [
  { giorni: 7, testo: "1 settimana" },
  { giorni: 14, testo: "2 settimane" },
  { giorni: 30, testo: "1 mese" },
  { giorni: 60, testo: "2 mesi" },
  { giorni: 90, testo: "3 mesi" },
];

/** «2026-11-30» → «30 novembre» (con l'anno solo se non è quello in corso). Vuoto se la data manca. */
export function dataIt(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return "";
  const [, anno, mese, giorno] = m.map(Number);
  const d = new Date(anno, mese - 1, giorno);
  const conAnno = anno !== new Date().getFullYear();
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", ...(conAnno ? { year: "numeric" } : {}) });
}

/** Oggi (o tra `piu` giorni) come «AAAA-MM-GG» nel fuso del telefono: serve ai limiti del campo data. */
export function giornoIso(piu = 0) {
  const d = new Date();
  d.setDate(d.getDate() + piu);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Quale scelta è attiva nel modulo: «aperta» (senza scadenza), «data» (fino a un giorno) o «giorni». */
export function modoDurata(f) {
  if (f?.open_ended) return "aperta";
  if (f?.end_date) return "data";
  return "giorni";
}

/** Durata scelta, in parole (per riepiloghi e messaggi). */
export function durataInParole(f) {
  const modo = modoDurata(f);
  if (modo === "aperta") return "senza scadenza";
  if (modo === "data") return `fino al ${dataIt(f.end_date)}`;
  const g = Number(f?.duration_days) || DURATA_PREDEFINITA;
  const rapida = DURATE_RAPIDE.find((x) => x.giorni === g);
  return rapida ? `${rapida.testo} (${g} giorni)` : g === 1 ? "1 giorno" : `${g} giorni`;
}

/** I tre campi della durata da mandare al server, uno solo valorizzato. */
export function campiDurata(f) {
  const modo = modoDurata(f);
  if (modo === "aperta") return { open_ended: true, duration_days: null, end_date: null };
  if (modo === "data") return { open_ended: false, duration_days: null, end_date: f.end_date };
  return { open_ended: false, duration_days: Number(f?.duration_days) || DURATA_PREDEFINITA, end_date: null };
}

/**
 * Scritta per i clienti sotto l'offerta: «Valida fino al 30 novembre», «Ultimo giorno», «Ultimi 3 giorni».
 * Vuoto se l'offerta non ha scadenza o il server non manda la data.
 */
export function scrittaValidita(d) {
  if (!d?.valid_until) return "";
  const rimasti = Number(d.days_left);
  if (rimasti === 1) return "Ultimo giorno: vale fino a stasera";
  if (rimasti > 1 && rimasti <= 3) return `Ultimi ${rimasti} giorni: vale fino al ${dataIt(d.valid_until)}`;
  return `Valida fino al ${dataIt(d.valid_until)}`;
}
