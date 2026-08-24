/**
 * BrandMark — "Sconti Roma" wordmark con smile arrow stile Amazon.
 *
 * L'arrow è un piccolo arco sotto le parole che parte sotto la "S" di "Sconti"
 * e finisce con la punta della freccia sotto la "a" finale di "Roma", esattamente
 * come il logo Amazon.
 *
 * Usage:
 *   <BrandMark />                    // testo + arrow (usa font ereditato)
 *   <BrandMark className="text-3xl"> // override size / colore
 *   <BrandMark arrowOnly />          // solo la freccia (icona standalone)
 *   <BrandMark inline />             // versione compatta per footer/copyright
 */
export default function BrandMark({
  className = "",
  arrowColor = "#FF2E93",
  arrowOnly = false,
  inline = false,
  children = "Sconti Roma",
}) {
  if (arrowOnly) {
    return <SmileArrow color={arrowColor} className={className} />;
  }
  return (
    <span
      data-testid="brand-mark"
      className={`inline-flex flex-col items-center leading-[0.9] ${className}`}
    >
      <span className={inline ? "font-semibold" : "font-serif"}>{children}</span>
      <SmileArrow color={arrowColor} className={inline ? "mt-0.5" : "mt-1"} />
    </span>
  );
}

/**
 * SmileArrow — la freccia curva stile Amazon.
 * Larghezza scala con em, così segue automaticamente la dimensione del testo
 * ereditata dal genitore (usa `w-[1em]` × più della lunghezza tipica).
 */
function SmileArrow({ color = "#FF2E93", className = "" }) {
  return (
    <svg
      viewBox="0 0 100 22"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={`block ${className}`}
      style={{ width: "5.5em", height: "1.2em" }}
    >
      {/* Curva del sorriso: parte da sinistra, si arcua verso il basso e risale a destra */}
      <path
        d="M 4 4 Q 50 24 92 8"
        fill="none"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Punta della freccia in alto a destra */}
      <path
        d="M 82 3 L 96 6 L 88 16"
        fill="none"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Named exports opzionali per composizione
export { SmileArrow };
