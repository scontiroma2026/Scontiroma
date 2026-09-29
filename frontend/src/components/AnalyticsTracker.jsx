import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { trackOpen, trackPageview } from "@/lib/analytics";
import { hasFunctionalConsent } from "@/components/CookieBanner";

export default function AnalyticsTracker() {
  const location = useLocation();
  // Il tracciamento (anche se anonimo) è un cookie "funzionale" secondo la
  // nostra stessa Cookie Policy: non deve partire prima che l'utente abbia
  // dato consenso esplicito, né se lo ha rifiutato.
  const [consented, setConsented] = useState(hasFunctionalConsent());

  useEffect(() => {
    const onConsentUpdate = () => setConsented(hasFunctionalConsent());
    window.addEventListener("sr:consent-updated", onConsentUpdate);
    return () => window.removeEventListener("sr:consent-updated", onConsentUpdate);
  }, []);

  useEffect(() => {
    if (consented) trackOpen();
  }, [consented]);

  useEffect(() => {
    if (consented) trackPageview(location.pathname);
  }, [consented, location.pathname]);

  return null;
}
