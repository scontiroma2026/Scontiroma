import { Sparkles, Store } from "lucide-react";

// Due pillole, decise dal server:
// - «Nuovo su Sconti Roma» (`isNewShop`): il negozio pubblica per la prima volta, per 7 giorni (fucsia-viola);
// - «Nuova offerta» (`isNew`): offerta pubblicata da meno di 48 ore, anche per chi rinnova il mese (teal, più discreta).
// Se valgono tutte e due, si mostra solo «Nuovo su Sconti Roma».
export default function BadgeNuovaOfferta({ isNew, isNewShop, className = "" }) {
  if (isNewShop) {
    return (
      <span
        data-testid="badge-nuovo-negozio"
        aria-label="Nuovo su Sconti Roma"
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full grad-fucsia-viola px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-lg ${className}`}
      >
        <Store size={11} aria-hidden="true" /> Nuovo su Sconti Roma
      </span>
    );
  }
  if (!isNew) return null;
  return (
    <span
      data-testid="badge-nuova-offerta"
      aria-label="Nuova offerta"
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ac-teal px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-lg ${className}`}
    >
      <Sparkles size={11} aria-hidden="true" /> Nuova offerta
    </span>
  );
}
