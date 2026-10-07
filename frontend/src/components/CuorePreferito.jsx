import { Heart } from "lucide-react";
import { usePreferiti } from "@/context/PreferitiContext";

/** Cuore per salvare il negozio tra i preferiti. Non apre la scheda su cui è appoggiato. */
export default function CuorePreferito({ merchantId, className = "" }) {
  const { ids, cambia } = usePreferiti();
  if (!merchantId) return null;
  const pieno = ids.includes(merchantId);
  return (
    <button
      type="button"
      data-testid={`preferito-${merchantId}`}
      data-pieno={pieno ? "1" : "0"}
      aria-pressed={pieno}
      aria-label={pieno ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); cambia(merchantId); }}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/70 backdrop-blur transition hover:scale-105 ${pieno ? "text-fucsia" : "text-white"} ${className}`}
    >
      <Heart size={20} fill={pieno ? "currentColor" : "none"} />
    </button>
  );
}
