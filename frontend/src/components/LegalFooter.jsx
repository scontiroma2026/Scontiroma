import { Link, useLocation } from "react-router-dom";

// Internal legal pages (self-hosted, no Iubenda needed)
export const LEGAL_LINKS = {
  privacy: "/privacy",
  cookie: "/cookies",
  terms: "/termini",
  recesso: "/recesso",
};

export default function LegalFooter() {
  const { pathname } = useLocation();
  // Hide on fullscreen scan pages
  if (pathname.startsWith("/qr/") || pathname === "/qr") return null;

  const openCookieBanner = () => {
    window.dispatchEvent(new CustomEvent("sr:open-cookie-banner"));
  };

  return (
    <footer
      data-testid="legal-footer"
      className="border-t border-white/10 bg-black/40 py-6 mt-8"
    >
      <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-white/50">
          © {new Date().getFullYear()} Sconti Roma · Made con amore ♡
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          <Link
            data-testid="footer-privacy"
            to={LEGAL_LINKS.privacy}
            className="text-white/70 hover:text-fucsia transition underline-offset-4 hover:underline"
          >
            Privacy
          </Link>
          <Link
            data-testid="footer-cookie"
            to={LEGAL_LINKS.cookie}
            className="text-white/70 hover:text-ciano transition underline-offset-4 hover:underline"
          >
            Cookie
          </Link>
          <Link
            data-testid="footer-terms"
            to={LEGAL_LINKS.terms}
            className="text-white/70 hover:text-neon transition underline-offset-4 hover:underline"
          >
            Termini
          </Link>
          <Link
            data-testid="footer-recesso"
            to={LEGAL_LINKS.recesso}
            className="text-white/70 hover:text-gold transition underline-offset-4 hover:underline"
          >
            Recesso
          </Link>
          <button
            data-testid="footer-manage-cookies"
            onClick={openCookieBanner}
            className="text-white/70 hover:text-terracotta transition underline-offset-4 hover:underline"
          >
            Gestisci cookie
          </button>
        </nav>
      </div>
    </footer>
  );
}
