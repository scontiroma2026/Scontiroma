/**
 * Pezzi comuni delle notifiche push (admin, commercianti, clienti): stesso service worker /sw-push.js,
 * stesse chiavi VAPID del server. Il service worker si registra solo quando qualcuno tocca «Attiva».
 */
export const SW_URL = "/sw-push.js";

export function pushSupportate() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function chiaveInByte(base64url) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const grezza = window.atob(b64);
  return Uint8Array.from(grezza, (c) => c.charCodeAt(0));
}

function stessaChiave(iscrizione, chiave) {
  try {
    const attuale = iscrizione?.options?.applicationServerKey;
    if (!attuale) return true; // il browser non la dice: si tiene l'iscrizione
    const a = new Uint8Array(attuale);
    return a.length === chiave.length && a.every((v, i) => v === chiave[i]);
  } catch (_) {
    return true;
  }
}

/** Iscrizione push di questo browser, solo se fatta con il nostro service worker. */
export async function iscrizioneAttuale() {
  if (!pushSupportate()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  if (!reg || !reg.active || !String(reg.active.scriptURL).endsWith(SW_URL)) return null;
  return reg.pushManager.getSubscription();
}

/**
 * Chiede il permesso (subito dopo il tocco: su iPhone è obbligatorio), registra il service worker e
 * ritorna { endpoint, keys } da mandare al server. Lancia "permesso-negato" se l'utente rifiuta.
 */
export async function creaIscrizione(chiavePubblica) {
  const permesso = await Notification.requestPermission();
  if (permesso !== "granted") throw new Error("permesso-negato");
  const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  await navigator.serviceWorker.ready;
  const chiave = chiaveInByte(await chiavePubblica());
  let iscrizione = await reg.pushManager.getSubscription();
  if (iscrizione && !stessaChiave(iscrizione, chiave)) {
    await iscrizione.unsubscribe();
    iscrizione = null;
  }
  if (!iscrizione) {
    iscrizione = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiave });
  }
  const j = iscrizione.toJSON();
  return { endpoint: j.endpoint, keys: j.keys };
}

export const MSG_PERMESSO_NEGATO = "Permesso negato: abilita le notifiche per Sconti Roma nelle Impostazioni del telefono.";
export const FRASE_IPHONE =
  "Su iPhone funziona solo se apri Sconti Roma dall'icona sulla schermata Home (Safari → Condividi → Aggiungi alla schermata Home), iOS 16.4 o successivo.";
