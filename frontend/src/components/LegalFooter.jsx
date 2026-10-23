import { Link, useLocation } from "react-router-dom";
import BrandMark from "@/components/BrandMark";

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
      className="border-t border-border bg-muted py-6 mt-8"
    >
      <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>© {new Date().getFullYear()}</span>
          <BrandMark inline className="text-muted-foreground" />
          <span>· Made con amore ♡</span>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          <Link
            data-testid="footer-commercianti"
            to="/per-i-commercianti"
            className="text-muted-foreground hover:text-fucsia transition underline-offset-4 hover:underline"
          >
            Per i commercianti
          </Link>
          <Link
            data-testid="footer-support"
            to="/support"
            className="text-muted-foreground hover:text-fucsia transition underline-offset-4 hover:underline"
          >
            Assistenza
          </Link>
          <Link
            data-testid="footer-privacy"
            to={LEGAL_LINKS.privacy}
            className="text-muted-foreground hover:text-fucsia transition underline-offset-4 hover:underline"
          >
            Privacy
          </Link>
          <Link
            data-testid="footer-cookie"
            to={LEGAL_LINKS.cookie}
            className="text-muted-foreground hover:text-ciano transition underline-offset-4 hover:underline"
          >
            Cookie
          </Link>
          <Link
            data-testid="footer-terms"
            to={LEGAL_LINKS.terms}
            className="text-muted-foreground hover:text-neon transition underline-offset-4 hover:underline"
          >
            Termini
          </Link>
          <Link
            data-testid="footer-recesso"
            to={LEGAL_LINKS.recesso}
            className="text-muted-foreground hover:text-gold transition underline-offset-4 hover:underline"
          >
            Recesso
          </Link>
          <button
            data-testid="footer-manage-cookies"
            onClick={openCookieBanner}
            className="text-muted-foreground hover:text-terracotta transition underline-offset-4 hover:underline"
          >
            Gestisci cookie
          </button>
        </nav>
      </div>
      {/* [PROPOSTA - DA VALIDARE] 23/10/2026: dati societari obbligatori (art. 2250 c.c.) dalla visura camerale. */}
      <p
        data-testid="footer-dati-societari"
        className="mx-auto max-w-7xl px-6 mt-3 text-center sm:text-left text-xs leading-relaxed text-muted-foreground"
      >
        EUROLINEA S.r.l.s. · Via Tasso 5/B, 83031 Ariano Irpino (AV) · C.F. e P.IVA 03240220644 ·
        REA AV-313674 · Capitale sociale 3.000,00 € · PEC{" "}
        <a href="mailto:eurolineasrls@alpec.it" className="hover:underline">eurolineasrls@alpec.it</a>
      </p>
    </footer>
  );
}
