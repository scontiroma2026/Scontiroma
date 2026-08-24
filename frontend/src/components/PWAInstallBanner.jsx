import { useEffect, useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import BrandMark from "@/components/BrandMark";

const STORAGE_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) && !window.MSStream;
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);
  const isSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  const isChromeAndroid = isAndroid && /Chrome/i.test(ua);
  if (isIOS) return isSafari ? "ios-safari" : "ios-other";
  if (isAndroid) return isChromeAndroid ? "android-chrome" : "android-other";
  return isMobile ? "mobile-other" : "desktop";
}

function isDismissedRecently() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch (_) {
    return false;
  }
}

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return; // already installed
    if (isDismissedRecently()) return;

    const p = detectPlatform();
    setPlatform(p);

    // Only show on mobile
    const isMobile = ["ios-safari", "ios-other", "android-chrome", "android-other", "mobile-other"].includes(p);
    if (!isMobile) return;

    // Listen for the native install prompt on Android/Chrome
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Delay show by 3s so it doesn't jump on first paint
    const t = setTimeout(() => setVisible(true), 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (_) {}
    setVisible(false);
  };

  const triggerNativePrompt = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setVisible(false);
      } else {
        dismiss();
      }
    } catch (_) {
      dismiss();
    }
  };

  if (!visible) return null;

  const isIOS = platform === "ios-safari" || platform === "ios-other";
  const isAndroid = platform === "android-chrome" || platform === "android-other";
  const canPrompt = !!deferredPrompt;

  return (
    <div
      data-testid="pwa-install-banner"
      className="fixed inset-x-3 bottom-3 z-[9999] mx-auto max-w-md rounded-2xl border border-fucsia/40 bg-[#0F0F0F]/95 p-4 shadow-2xl backdrop-blur-md"
      style={{ animation: "slideUpBanner 0.5s ease-out" }}
      role="dialog"
      aria-label="Installa app Sconti Roma"
    >
      <button
        data-testid="pwa-install-dismiss"
        onClick={dismiss}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition"
        aria-label="Chiudi"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl grad-fucsia-viola glow-fucsia">
          <Smartphone size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="font-serif text-lg leading-tight text-white">
            Installa <BrandMark inline className="text-white" /> sul tuo telefono!
          </div>

          {isIOS && (
            <div data-testid="pwa-hint-ios" className="mt-2 text-sm text-white/75 leading-relaxed">
              Clicca sul tasto <strong className="text-ciano">Condividi</strong>{" "}
              <Share size={14} className="inline align-middle text-ciano" /> in basso
              e seleziona <strong className="text-fucsia">➕ Aggiungi alla schermata Home</strong>.
            </div>
          )}

          {isAndroid && !canPrompt && (
            <div data-testid="pwa-hint-android" className="mt-2 text-sm text-white/75 leading-relaxed">
              Clicca sui <strong className="text-ciano">3 puntini</strong> in alto a destra
              e seleziona <strong className="text-fucsia">Installa applicazione</strong>.
            </div>
          )}

          {isAndroid && canPrompt && (
            <>
              <div className="mt-2 text-sm text-white/75">
                Aggiungila alla home per accedere ai tuoi sconti con un tap.
              </div>
              <button
                data-testid="pwa-install-native-btn"
                onClick={triggerNativePrompt}
                className="mt-3 inline-flex items-center gap-2 rounded-full grad-fucsia-viola px-5 py-2 text-sm font-semibold text-white hover:scale-105 transition"
              >
                <Download size={16} /> Installa ora
              </button>
            </>
          )}

          {!isIOS && !isAndroid && (
            <div className="mt-2 text-sm text-white/75">
              Apri Sconti Roma sul tuo smartphone per aggiungerla alla Home.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
