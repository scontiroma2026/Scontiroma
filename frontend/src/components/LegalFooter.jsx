import { Link, useLocation } from "react-router-dom";

// Placeholder Iubenda URLs — replace with real IDs when provided
export const LEGAL_LINKS = {
  privacy: "#privacy-policy",
  cookie: "#cookie-policy",
  terms: "#termini-condizioni",
};

const HIDE_ON = new Set(["/qr", "/login", "/setup-security"]);

export default function LegalFooter() {
  const { pathname } = useLocation();
  // Hide on fullscreen scan pages and specific narrow pages
  if (pathname.startsWith("/qr/") || pathname === "/qr") return null;

  return (
    <footer data-testid="legal-footer" className="border-t border-white/10 bg-black/40 py-6 mt-8">
      <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-white/50">
          © {new Date().getFullYear()} Sconti Roma · Made con amore ♡
        </div>
        <nav className="flex flex-wrap gap-4">
          <a
            data-testid="footer-privacy"
            href={LEGAL_LINKS.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-fucsia transition underline-offset-4 hover:underline"
          >
            Privacy Policy
          </a>
          <a
            data-testid="footer-cookie"
            href={LEGAL_LINKS.cookie}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-ciano transition underline-offset-4 hover:underline"
          >
            Cookie Policy
          </a>
          <a
            data-testid="footer-terms"
            href={LEGAL_LINKS.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-neon transition underline-offset-4 hover:underline"
          >
            Termini e Condizioni
          </a>
        </nav>
      </div>
    </footer>
  );
}
