// Bozze locali dei moduli del commerciante (offerta, descrizione del negozio).
// Restano SOLO sul telefono (localStorage), con chiave per utente e per scheda; si cancellano
// dopo l'invio, con «Scarta» e all'uscita (logout). Ogni accesso a localStorage è protetto:
// può essere pieno, disattivato o bloccato (navigazione privata).
import { useCallback, useEffect, useRef, useState } from "react";

export const SCHEMA = 1;
export const PREFISSO = "sr_bozza_v";
export const LIMITE_BYTE = 2 * 1024 * 1024; // sopra ~2 MB le foto non entrano nella bozza
export const RITARDO_MS = 500;

export const chiaveBozza = (utente, scheda) => `${PREFISSO}${SCHEMA}:${utente}:${scheda}`;

export function leggiBozza(chiave) {
  try {
    const raw = localStorage.getItem(chiave);
    if (!raw) return null;
    const b = JSON.parse(raw);
    if (!b || b.schema !== SCHEMA || b.dati === undefined) return null;
    return b;
  } catch (_) { return null; }
}

export function scriviBozza(chiave, bozza) {
  try { localStorage.setItem(chiave, JSON.stringify({ schema: SCHEMA, ts: Date.now(), ...bozza })); return true; } catch (_) { return false; }
}

export function togliBozza(chiave) {
  try { localStorage.removeItem(chiave); } catch (_) { /* localStorage non disponibile */ }
}

/** Cancella tutte le bozze (logout: non le lasciamo a un altro utente dello stesso telefono). */
export function togliTutteLeBozze() {
  try {
    const chiavi = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFISSO)) chiavi.push(k);
    }
    chiavi.forEach((k) => localStorage.removeItem(k));
  } catch (_) { /* localStorage non disponibile */ }
}

const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const senzaCampi = (o, campi) => {
  if (!o || typeof o !== "object" || !campi.length) return o;
  const c = { ...o };
  campi.forEach((k) => { delete c[k]; });
  return c;
};

/**
 * Bozza automatica di un modulo.
 * - valore: i dati attuali del modulo; base: i dati "puliti" (server o iniziali).
 * - pronto: true solo quando i dati del server sono arrivati (mai prima).
 * - chiave: null finché non c'è un utente.
 * - vuoto(valore): true se non c'è nulla di scritto (le bozze vuote non si salvano).
 * - campiGrandi: campi (foto) che entrano nella bozza solo se il totale resta sotto LIMITE_BYTE.
 * Restituisce { inAttesa, fotoPerse, riprendi(), scarta(), cancella() }:
 * `inAttesa` è una bozza diversa dai dati del server, da mostrare con «Riprendi» / «Scarta».
 */
export function useBozza({ chiave, valore, base, pronto, bloccato = false, vuoto, campiGrandi = [], applica }) {
  const [inAttesa, setInAttesa] = useState(null);
  const chiaveAttuale = useRef(chiave);
  chiaveAttuale.current = chiave;
  const ultimo = useRef(null); // scrittura in sospeso (per salvarla se si esce di pagina)

  const salva = (k, v, b) => {
    if (!k) return;
    if (vuoto(v) || uguali(v, b)) { togliBozza(k); return; }
    let dati = v; let fotoPerse = false;
    let testo = JSON.stringify(v);
    if (testo.length > LIMITE_BYTE) {
      dati = senzaCampi(v, campiGrandi); fotoPerse = true;
      testo = JSON.stringify(dati);
      if (testo.length > LIMITE_BYTE) return;
      if (vuoto(dati) || uguali(dati, senzaCampi(b, campiGrandi))) { togliBozza(k); return; }
    }
    if (!scriviBozza(k, { dati, fotoPerse }) && !fotoPerse && campiGrandi.length) {
      // Memoria piena: riprova senza foto, poi rinuncia in silenzio
      scriviBozza(k, { dati: senzaCampi(v, campiGrandi), fotoPerse: true });
    }
  };

  // All'apertura (o cambio scheda/dati del server): c'è una bozza diversa dai dati del server?
  const baseTesto = JSON.stringify(base);
  useEffect(() => {
    setInAttesa(null);
    if (!pronto || !chiave) return;
    const b = leggiBozza(chiave);
    if (!b) return;
    const [x, y] = b.fotoPerse ? [senzaCampi(b.dati, campiGrandi), senzaCampi(base, campiGrandi)] : [b.dati, base];
    if (uguali(x, y) || vuoto(b.dati)) togliBozza(chiave);
    else setInAttesa(b);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [chiave, pronto, baseTesto]);

  // Salvataggio automatico con un piccolo ritardo
  const attivo = Boolean(pronto && chiave && !bloccato && !inAttesa);
  useEffect(() => {
    if (!attivo) { ultimo.current = null; return undefined; }
    const mio = () => salva(chiave, valore, base);
    ultimo.current = mio;
    const t = setTimeout(() => { if (ultimo.current) ultimo.current(); ultimo.current = null; }, RITARDO_MS);
    return () => {
      clearTimeout(t);
      // Cambio di scheda con una scrittura ancora in sospeso: va salvata sulla scheda di prima
      if (ultimo.current === mio && chiaveAttuale.current !== chiave) mio();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [attivo, chiave, JSON.stringify(valore), baseTesto]);

  // Uscita dalla pagina o app in secondo piano (iPhone): salva subito quello che è in sospeso
  useEffect(() => {
    const subito = () => { if (ultimo.current) { ultimo.current(); ultimo.current = null; } };
    const nascosta = () => { if (document.visibilityState === "hidden") subito(); };
    document.addEventListener("visibilitychange", nascosta);
    window.addEventListener("pagehide", subito);
    return () => {
      document.removeEventListener("visibilitychange", nascosta);
      window.removeEventListener("pagehide", subito);
      subito();
    };
  }, []);

  const cancella = useCallback(() => {
    ultimo.current = null;
    if (chiave) togliBozza(chiave);
    setInAttesa(null);
  }, [chiave]);

  const riprendi = () => {
    if (!inAttesa) return;
    applica(inAttesa.dati, Boolean(inAttesa.fotoPerse));
    setInAttesa(null);
  };

  return { inAttesa, fotoPerse: Boolean(inAttesa?.fotoPerse), riprendi, scarta: cancella, cancella };
}
