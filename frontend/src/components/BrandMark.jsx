/**
 * BrandMark — logo di "Sconti Roma".
 *
 * Progettato da zero (NON è la freccia Amazon): un piccolo mark composto da
 * TRE archi degradanti stile acquedotto romano (le colline / porte della città),
 * sormontati da una piccola stellina "sparkle" fucsia (il segno dello sconto).
 * Sotto — o accanto, in modalità "inline" — compare la wordmark "Sconti Roma".
 *
 * Il logo scala automaticamente in base al font-size ereditato, così l'icona
 * segue naturalmente la dimensione del testo che lo accompagna.
 *
 * Usage:
 *   <BrandMark />                    // icona + testo, colonna verticale
 *   <BrandMark inline />             // icona + testo, riga orizzontale
 *   <BrandMark iconOnly />           // solo l'icona (favicon/loader/badge)
 *   <BrandMark className="text-3xl"> // scala tutto in base a font-size
 */
export default function BrandMark({
  className = "",
  iconOnly = false,
  inline = false,
  children = "Sconti Roma",
}) {
  if (iconOnly) {
    return <SRIcon className={className} />;
  }
  if (inline) {
    return (
      <span
        data-testid="brand-mark"
        className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}
      >
        <SRIcon />
        <span className="font-semibold">{children}</span>
      </span>
    );
  }
  return (
    <span
      data-testid="brand-mark"
      className={`inline-flex flex-col items-center gap-1 leading-none ${className}`}
    >
      <SRIcon />
      <span className="font-serif">{children}</span>
    </span>
  );
}

/**
 * SRIcon — il logo del brand: silhouette del Colosseo stilizzato.
 *
 * Elementi (stile minimal, in linea col resto dell'app):
 *  - Doppio ordine di archi (bottom + upper gallery) come nell'anfiteatro reale.
 *  - Arco centrale del piano inferiore PIENO in fucsia — accento del brand.
 *  - Skyline "stepped" che riprende il muro sud crollato del Colosseo
 *    (metà alta a sinistra, metà più bassa a destra).
 *  - Sparkle ciano a 4 punte in alto a destra → segnale sconto.
 *  - Linea rosa alla base → suolo/pavimento romano.
 *  - Gli outline seguono `currentColor` così si adattano al testo circostante.
 */
function SRIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 40 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={`block ${className}`}
      style={{ width: "1.35em", height: "1.05em" }}
    >
      {/* Sparkle sconto in alto a destra */}
      <path
        d="M 34.5 3
           L 35.8 5.7
           L 38.5 7
           L 35.8 8.3
           L 34.5 11
           L 33.2 8.3
           L 30.5 7
           L 33.2 5.7 Z"
        fill="#00E5FF"
        opacity="0.95"
      />

      {/* Base orizzontale (suolo romano) */}
      <line
        x1="2.5" y1="27" x2="31.5" y2="27"
        stroke="#FF2E93"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Skyline superiore stepped: parte alta a sinistra, parte crollata a destra */}
      <path
        d="M 4 15
           L 4 9
           L 18 9
           L 18 12
           L 30 12
           L 30 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Piano superiore: 4 archi piccoli in outline */}
      <path
        d="M 6 15 L 6 12.5 Q 6 10.8 7.5 10.8 Q 9 10.8 9 12.5 L 9 15
           M 11 15 L 11 12.5 Q 11 10.8 12.5 10.8 Q 14 10.8 14 12.5 L 14 15
           M 16 15 L 16 12.5 Q 16 10.8 17 10.8
           M 21 15 L 21 13.6 Q 21 12.6 22.5 12.6 Q 24 12.6 24 13.6 L 24 15
           M 26 15 L 26 13.6 Q 26 12.6 27.5 12.6 Q 29 12.6 29 13.6 L 29 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Fascia orizzontale che separa i due ordini */}
      <line
        x1="4" y1="16.5" x2="30" y2="16.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Piano inferiore: 4 archi grandi, il centrale PIENO fucsia (accento brand) */}
      {/* Arco 1 (sinistra) — outline */}
      <path
        d="M 5 26.5 L 5 21 Q 5 17.5 8 17.5 Q 11 17.5 11 21 L 11 26.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Arco 2 CENTRALE — pieno fucsia */}
      <path
        d="M 12 26.5 L 12 20.5 Q 12 17 15.5 17 Q 19 17 19 20.5 L 19 26.5 Z"
        fill="#FF2E93"
      />
      {/* Arco 3 — outline */}
      <path
        d="M 20 26.5 L 20 21 Q 20 17.5 23 17.5 Q 26 17.5 26 21 L 26 26.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Arco 4 (destra) — outline più basso (lato "crollato") */}
      <path
        d="M 27 26.5 L 27 22 Q 27 19 29.5 19 Q 32 19 32 22 L 32 26.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Named exports opzionali per composizione avanzata
export { SRIcon };
