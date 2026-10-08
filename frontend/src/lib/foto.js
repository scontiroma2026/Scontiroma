// Preparazione delle foto nel browser (iPhone/Safari compreso):
// la foto scattata o scelta viene letta, ridimensionata a un lato massimo e salvata in JPEG.
// Se non si riesce, si lancia un FotoError con un messaggio chiaro in italiano:
// non si sostituisce MAI in silenzio la foto con un'immagine di default.

export const LATO_MAX = 1600;
export const QUALITA_JPEG = 0.85;
// Le foto dell'iPhone pesano 2–10 MB (fino a ~30 MB a 48 Mpx): le rimpiccioliamo noi.
export const MAX_FILE_BYTES = 40 * 1024 * 1024;
// Dopo il ridimensionamento una foto sana pesa ben meno di 1 MB: oltre 4 MB qualcosa non va.
export const MAX_USCITA_BYTES = 4 * 1024 * 1024;

export class FotoError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FotoError";
    this.code = code;
  }
}

export const MSG_TROPPO_GRANDE = "Foto troppo grande. Scegline una più piccola o scattala con una risoluzione più bassa.";
export const MSG_FORMATO = "Formato non supportato. Usa una foto JPG o PNG.";
export const MSG_HEIC = "Formato non supportato (HEIC). Su iPhone: Impostazioni › Fotocamera › Formati › «Più compatibile», oppure scegli una foto JPG o PNG.";

const eHeic = (file) =>
  /hei[cf]/i.test(file?.type || "") || /\.hei[cf]$/i.test(file?.name || "");

function caricaImmagine(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decodifica"));
    img.src = src;
  });
}

/** Controlla il file e lo decodifica. Restituisce un'immagine pronta da disegnare. */
export async function leggiFoto(file) {
  if (!file) throw new FotoError("vuoto", "Nessuna foto selezionata.");
  const tipo = file.type || "";
  // Alcuni telefoni non indicano il tipo: in quel caso proviamo comunque a decodificare.
  if (tipo && !tipo.startsWith("image/") && !eHeic(file)) throw new FotoError("formato", MSG_FORMATO);
  if (tipo === "image/svg+xml") throw new FotoError("formato", MSG_FORMATO);
  if (file.size > MAX_FILE_BYTES) throw new FotoError("troppo-grande", MSG_TROPPO_GRANDE);
  if (file.size === 0) throw new FotoError("formato", MSG_FORMATO);
  const url = URL.createObjectURL(file);
  try {
    return await caricaImmagine(url);
  } catch (_) {
    throw new FotoError(eHeic(file) ? "heic" : "formato", eHeic(file) ? MSG_HEIC : MSG_FORMATO);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Misure ridimensionate con lato lungo al massimo `latoMax`. */
export function misureRidotte(w, h, latoMax = LATO_MAX) {
  const scala = Math.min(1, latoMax / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scala)), h: Math.max(1, Math.round(h * scala)) };
}

/** Disegna l'immagine in un canvas ridotto (sfondo bianco, così il PNG trasparente non diventa nero). */
export function disegnaRidotta(img, latoMax = LATO_MAX) {
  const { w, h } = misureRidotte(img.naturalWidth || img.width, img.naturalHeight || img.height, latoMax);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FotoError("troppo-grande", MSG_TROPPO_GRANDE);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/** Da canvas a JPEG (data URL), con controllo del peso finale. */
export function canvasInJpeg(canvas) {
  const dataUrl = canvas.toDataURL("image/jpeg", QUALITA_JPEG);
  // Se il browser non sa produrre JPEG, restituisce un PNG: non va bene per il peso.
  if (!dataUrl.startsWith("data:image/jpeg")) throw new FotoError("formato", MSG_FORMATO);
  if (dataUrl.length * 0.75 > MAX_USCITA_BYTES) throw new FotoError("troppo-grande", MSG_TROPPO_GRANDE);
  return dataUrl;
}
