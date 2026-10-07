import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Vero sulle pagine dell'area commerciante (/merchant/...). */
export const useInAreaCommerciante = () => useLocation().pathname.startsWith("/merchant");

/**
 * Mette la classe `area-commerciante` su <html> mentre si è nell'area commerciante:
 * da quel momento valgono i colori chiari di area-commerciante.css (variante «Bianco vivo»).
 * Fuori da quelle pagine la classe viene tolta e il sito resta com'era.
 */
export default function AreaCommercianteClasse() {
  const dentro = useInAreaCommerciante();
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("area-commerciante", dentro);
    return () => document.documentElement.classList.remove("area-commerciante");
  }, [dentro]);
  return null;
}
