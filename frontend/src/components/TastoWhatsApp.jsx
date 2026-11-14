import { WHATSAPP_PATH } from "@/lib/socialGlyphs";

// Colori veri di WhatsApp (come l'icona dell'iPhone): verde chiaro sfumato e scritta scura,
// così il pulsante si riconosce subito e non sembra un'imitazione (richiesta del titolare, 14/11).
// La scritta scura su questo verde ha un contrasto di circa 9:1.
export const CLASSE_WHATSAPP = "bg-gradient-to-b from-[#61FD7D] to-[#25CF43] text-slate-900 shadow-md shadow-emerald-500/30 [@media(hover:hover)]:hover:brightness-105";

/** Glifo ufficiale di WhatsApp (simple-icons, CC0), del colore del testo. */
export function IconaWhatsApp({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path fill="currentColor" d={WHATSAPP_PATH} />
    </svg>
  );
}
