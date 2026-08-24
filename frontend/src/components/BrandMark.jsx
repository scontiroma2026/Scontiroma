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
 * SRIcon — l'icona vera e propria, ~1.1em × 1em, allineata al testo.
 *
 * Elementi:
 *  - Stella di 4 punte (sparkle) sul lato in alto a destra → segnale sconto.
 *  - Tre archi decrescenti da sinistra a destra → acquedotto/porte di Roma
 *    riletto in chiave moderna. I due archi laterali sono outline, quello
 *    centrale è pieno (accento fucsia) → dà focus e ritmo.
 *  - Base lineare orizzontale → suolo su cui poggiano gli archi.
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
      {/* Sparkle dello sconto (in alto a destra) */}
      <path
        d="M 33 4
           L 34.5 7.5
           L 38 9
           L 34.5 10.5
           L 33 14
           L 31.5 10.5
           L 28 9
           L 31.5 7.5
           Z"
        fill="#00E5FF"
        opacity="0.95"
      />

      {/* Base orizzontale (suolo/pavimento romano) */}
      <line
        x1="2" y1="27" x2="30" y2="27"
        stroke="#FF2E93"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Arco sinistro — outline */}
      <path
        d="M 3 26 L 3 18 Q 3 12 8 12 Q 13 12 13 18 L 13 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Arco centrale — pieno fucsia (l'accento del brand) */}
      <path
        d="M 14 26 L 14 15 Q 14 8 19.5 8 Q 25 8 25 15 L 25 26 Z"
        fill="#FF2E93"
      />

      {/* Arco destro — outline, più piccolo (prospettiva) */}
      <path
        d="M 26 26 L 26 20 Q 26 15 29.5 15 Q 33 15 33 20 L 33 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Named exports opzionali per composizione avanzata
export { SRIcon };
