import { WHATSAPP_PATH } from "@/lib/socialGlyphs";

// Colori ufficiali di WhatsApp (decisione del titolare, 14/11): fondo #25D366, #128C7E al passaggio
// del dito/mouse, scritta e icona bianche #FFFFFF, perché il pulsante si riconosca subito e non sembri un falso.
// Il bianco su #25D366 ha contrasto basso (circa 2:1): i test del contrasto saltano solo gli elementi
// con `data-marchio-whatsapp` (DATI_WHATSAPP), per questa scelta del titolare.
export const CLASSE_WHATSAPP = "bg-[#25D366] text-white font-extrabold shadow-md shadow-emerald-500/30 [@media(hover:hover)]:hover:bg-[#128C7E] active:bg-[#128C7E]";
export const DATI_WHATSAPP = { "data-marchio-whatsapp": "" };

/** Glifo ufficiale di WhatsApp (simple-icons, CC0), bianco come il testo. */
export function IconaWhatsApp({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path fill="currentColor" d={WHATSAPP_PATH} />
    </svg>
  );
}
