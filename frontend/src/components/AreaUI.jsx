import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Pezzi di interfaccia dell'area commerciante (variante «Bianco vivo»).
 * Solo aspetto: nessuna logica. Le classi `ac-*` sono definite in tailwind.config.js
 * e tema-chiaro.css.
 */

// Ogni «tono» è una famiglia di colori vivi (testo scuro abbastanza da restare leggibile su bianco).
export const TONI = {
  rosa: { testo: "text-ac-rosa", punto: "bg-ac-rosa", fondo: "bg-ac-rosaBg", bordo: "border-ac-rosa" },
  // «viola» (nome storico) = miele: puntino e fondo ambra pieni, testo scuro
  viola: { testo: "text-ac-mieleInk", punto: "bg-ac-miele", fondo: "bg-ac-miele", bordo: "border-ac-miele" },
  teal: { testo: "text-ac-teal", punto: "bg-ac-teal", fondo: "bg-ac-tealBg", bordo: "border-ac-teal" },
  verde: { testo: "text-ac-verde", punto: "bg-ac-verde", fondo: "bg-ac-verdeBg", bordo: "border-ac-verde" },
  ambra: { testo: "text-ac-ambra", punto: "bg-ac-ambra", fondo: "bg-ac-ambraBg", bordo: "border-ac-ambra" },
  rosso: { testo: "text-ac-rosso", punto: "bg-ac-rosso", fondo: "bg-ac-rossoBg", bordo: "border-ac-rosso" },
};

/** Riquadro bianco con bordo leggero; `titolo` è l'etichetta colorata con il puntino. */
export function Scheda({ titolo, tono = "rosa", icona, destra, children, className = "", ...rest }) {
  const t = TONI[tono];
  return (
    <section
      className={`rounded-[18px] border border-ac-line bg-white p-[18px] shadow-[0_1px_0_rgba(34,28,16,0.03)] ${className}`}
      {...rest}
    >
      {(titolo || destra) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {titolo && (
            <h2 className={`font-testo flex items-center gap-2 text-[13px] font-extrabold ${t.testo}`}>
              {icona ? <span aria-hidden="true">{icona}</span> : <span aria-hidden="true" className={`h-[9px] w-[9px] rounded-full ${t.punto}`} />}
              {titolo}
            </h2>
          )}
          {destra && <span className="text-xs font-semibold text-ac-mute">{destra}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Piccola etichetta tondeggiante (stato). */
export function Pillola({ tono = "verde", children, className = "", ...rest }) {
  const t = TONI[tono];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${t.fondo} ${t.testo} ${className}`} {...rest}>
      {children}
    </span>
  );
}

/** Messaggio per le liste vuote: icona colorata, frase chiara, eventuale azione. */
export function StatoVuoto({ icona, tono = "viola", children, azione, ...rest }) {
  const t = TONI[tono];
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-ac-tint px-5 py-8 text-center" {...rest}>
      {icona && <span className={`flex h-12 w-12 items-center justify-center rounded-full ${t.fondo} ${t.testo}`}>{icona}</span>}
      <p className="text-sm font-semibold text-ac-soft">{children}</p>
      {azione}
    </div>
  );
}

/** Errore di caricamento con pulsante «Riprova» (alto almeno 44 px). */
export function ErroreRiprova({ children = "Non riusciamo a caricare i dati.", onRiprova, ...rest }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-ac-rosso/30 bg-ac-rossoBg p-4" {...rest}>
      <p className="flex items-start gap-2 text-sm font-semibold text-ac-rosso">
        <AlertCircle size={18} className="mt-0.5 shrink-0" /> {children}
      </p>
      {onRiprova && (
        <button
          type="button"
          onClick={onRiprova}
          className="flex min-h-11 items-center gap-2 rounded-xl border-2 border-ac-rosso px-4 text-sm font-extrabold text-ac-rosso hover:bg-white"
        >
          <RefreshCw size={16} /> Riprova
        </button>
      )}
    </div>
  );
}

/** Segnaposto grigio-lavanda mentre i dati arrivano. */
export function Scheletro({ className = "" }) {
  return <div aria-hidden="true" className={`ac-skel ${className}`} />;
}

/** Pulsante pieno fucsia-viola con testo bianco (azione principale). */
export const CLASSE_PRIMARIO =
  "ac-grad ac-ombra-rosa inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl px-6 text-base font-extrabold text-white transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none";

/** Pulsante con bordo colorato e testo dello stesso colore (azione secondaria). */
export const CLASSE_BORDO = {
  rosa: "border-2 border-ac-rosa text-ac-rosa hover:bg-ac-rosaSoft",
  viola: "border-2 border-ac-miele text-ac-mieleInk hover:bg-ac-mieleBg",
  teal: "border-2 border-ac-teal text-ac-teal hover:bg-ac-tealBg",
};
export const CLASSE_BASE_SECONDARIO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-transparent px-4 text-sm font-extrabold transition disabled:opacity-50";
