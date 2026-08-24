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
 * Design minimal, mono-piano (senza upper gallery di piccoli archi):
 *  - Skyline "stepped" (metà alta a sinistra, metà crollata a destra) →
 *    il tratto più iconico del Colosseo reale.
 *  - 4 archi in outline sulla facciata + arco centrale PIENO fucsia →
 *    accento del brand.
 *  - Sparkle ciano a 4 punte sopra a destra → segnale sconto.
 *  - Linea rosa alla base → il suolo romano.
 *  - Gli outline seguono `currentColor` così si adattano al testo attorno.
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

      {/* Skyline del Colosseo: parte alta a sinistra, parte "crollata" a destra */}
      <path
        d="M 4 27
           L 4 11
           L 18 11
           L 18 14
           L 30 14
           L 30 27"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Facciata: 4 archi grandi, il centrale PIENO fucsia (accento brand) */}
      {/* Arco 1 (sinistra) — outline */}
      <path
        d="M 6 26.5 L 6 20 Q 6 16.5 9 16.5 Q 12 16.5 12 20 L 12 26.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Arco 2 CENTRALE — pieno fucsia */}
      <path
        d="M 13 26.5 L 13 19.5 Q 13 16 16.5 16 Q 20 16 20 19.5 L 20 26.5 Z"
        fill="#FF2E93"
      />
      {/* Arco 3 — outline */}
      <path
        d="M 21 26.5 L 21 20 Q 21 16.5 23.5 16.5 Q 26 16.5 26 20 L 26 26.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Arco 4 (destra, più basso — lato "crollato") */}
      <path
        d="M 27 26.5 L 27 21.5 Q 27 18.5 29 18.5 Q 31 18.5 31 21.5 L 31 26.5"
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
