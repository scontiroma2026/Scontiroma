import { Sparkles } from "lucide-react";

// Pillola «Nuova offerta»: il server decide con `is_new` (pubblicata da meno di 48 ore).
export default function BadgeNuovaOfferta({ isNew, className = "" }) {
  if (!isNew) return null;
  return (
    <span
      data-testid="badge-nuova-offerta"
      aria-label="Nuova offerta"
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full grad-fucsia-viola px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-lg ${className}`}
    >
      <Sparkles size={11} aria-hidden="true" /> Nuova offerta
    </span>
  );
}
