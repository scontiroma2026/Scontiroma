import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Cookie, Shield, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const CONSENT_KEY = "sr_cookie_consent";
const CONSENT_VERSION = 1;

const DEFAULT_PREFS = {
  essential: true, // always on
  functional: false,
  marketing: false, // reserved for future
};

function readConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(prefs, action) {
  const payload = {
    version: CONSENT_VERSION,
    action, // "accept_all" | "reject_all" | "custom"
    prefs,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  // Log server-side for GDPR proof (best-effort, non-blocking)
  api
    .post("/gdpr/consent-log", {
      action: payload.action,
      prefs: payload.prefs,
    })
    .catch(() => {
      /* silent — banner still works if backend is down */
    });
  return payload;
}

const HIDE_ROUTES = ["/qr", "/preview"];

export default function CookieBanner() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      // slight delay so it doesn't cover initial UX
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  // Expose an imperative reopen via custom event so LegalFooter can trigger it
  useEffect(() => {
    const handler = () => {
      const existing = readConsent();
      if (existing) setPrefs({ ...DEFAULT_PREFS, ...existing.prefs });
      setShowPrefs(true);
      setVisible(true);
    };
    window.addEventListener("sr:open-cookie-banner", handler);
    return () => window.removeEventListener("sr:open-cookie-banner", handler);
  }, []);

  const hideOnRoute =
    pathname.startsWith("/qr") || pathname.startsWith("/preview");
  if (hideOnRoute) return null;
  if (!visible) return null;

  const acceptAll = () => {
    saveConsent(
      { essential: true, functional: true, marketing: true },
      "accept_all"
    );
    setVisible(false);
  };

  const rejectAll = () => {
    saveConsent(
      { essential: true, functional: false, marketing: false },
      "reject_all"
    );
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent({ ...prefs, essential: true }, "custom");
    setVisible(false);
  };

  return (
    <div
      data-testid="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-[9999] px-3 pb-3 sm:px-6 sm:pb-6 animate-in slide-in-from-bottom duration-300"
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-[#141419]/98 shadow-2xl backdrop-blur-xl">
        {!showPrefs ? (
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fucsia/15 text-fucsia">
                <Cookie size={20} />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-xl text-white">
                  I biscotti della casa
                </h2>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  Usiamo cookie <strong>tecnici essenziali</strong> per farti
                  accedere in sicurezza. Se ci autorizzi, useremo anche cookie{" "}
                  <strong>funzionali</strong> per ricordare le tue preferenze
                  (mappa, geolocalizzazione).{" "}
                  <strong>Non usiamo profilazione né tracciamento pubblicitario.</strong>{" "}
                  Leggi la{" "}
                  <Link
                    to="/cookies"
                    className="text-ciano hover:underline"
                    data-testid="cookie-banner-policy-link"
                  >
                    Cookie Policy
                  </Link>{" "}
                  completa.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                data-testid="cookie-reject"
                onClick={rejectAll}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/5"
              >
                Rifiuta
              </Button>
              <Button
                data-testid="cookie-customize"
                onClick={() => setShowPrefs(true)}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/5"
              >
                Personalizza
              </Button>
              <Button
                data-testid="cookie-accept-all"
                onClick={acceptAll}
                className="grad-fucsia-viola text-white hover:scale-[1.02] transition"
              >
                Accetta tutti
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ciano/15 text-ciano">
                  <Shield size={20} />
                </div>
                <h2 className="font-serif text-xl text-white">
                  Preferenze cookie
                </h2>
              </div>
              <button
                data-testid="cookie-close"
                onClick={() => setShowPrefs(false)}
                className="text-white/50 hover:text-white transition"
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <PrefRow
                testid="pref-essential"
                title="Essenziali"
                desc="Necessari per il funzionamento (login, sessione, sicurezza). Non disattivabili."
                checked
                disabled
              />
              <PrefRow
                testid="pref-functional"
                title="Funzionali"
                desc="Ricordano preferenze come mappa e geolocalizzazione. Migliorano l'esperienza."
                checked={prefs.functional}
                onChange={(v) => setPrefs({ ...prefs, functional: v })}
              />
              <PrefRow
                testid="pref-marketing"
                title="Marketing (nessuno attivo)"
                desc="Al momento non usiamo cookie di marketing o profilazione. Riservato a futuri usi con nuovo consenso."
                checked={prefs.marketing}
                onChange={(v) => setPrefs({ ...prefs, marketing: v })}
              />
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                data-testid="cookie-save-custom"
                onClick={saveCustom}
                className="grad-fucsia-viola text-white hover:scale-[1.02] transition"
              >
                Salva preferenze <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrefRow({ testid, title, desc, checked, onChange, disabled }) {
  return (
    <label
      data-testid={testid}
      className={`flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3 ${
        disabled ? "opacity-70" : "cursor-pointer hover:bg-black/60"
      }`}
    >
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-fucsia"
      />
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 text-xs text-white/60 leading-relaxed">{desc}</div>
      </div>
    </label>
  );
}

// Helper for external code to check current consent (e.g. before loading maps)
export function getConsent() {
  return readConsent();
}
