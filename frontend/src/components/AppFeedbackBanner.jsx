import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, X } from "lucide-react";
import { toast } from "sonner";

const LS_KEY = "app_feedback_dismissed_v1";
const LS_TEMPO = "app_feedback_secondi_v1";
// Mai sopra la cassa: il commerciante sta scansionando il QR di un cliente
const HIDDEN_PREFIXES = ["/locandina", "/admin", "/scan", "/merchant/scan"];
const DOPO_SECONDI = 180;

const leggi = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, v); } catch { /* modalità privata */ } };

/**
 * Banner in basso che chiede una valutazione a stelle sull'app.
 * Mostrato solo a utenti loggati (client/merchant) che non hanno ancora votato,
 * dopo 3 minuti di uso dell'app (sommati tra una visita e l'altra, solo con la pagina in primo piano).
 */
export default function AppFeedbackBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const [pronto, setPronto] = useState(false);

  // Conta i secondi di uso con la pagina visibile; a 3 minuti il banner può comparire
  useEffect(() => {
    if (!user || user.role === "admin" || leggi(LS_KEY)) return;
    let secondi = parseInt(leggi(LS_TEMPO) || "0", 10) || 0;
    if (secondi >= DOPO_SECONDI) { setPronto(true); return; }
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      secondi += 5;
      scrivi(LS_TEMPO, String(secondi));
      if (secondi >= DOPO_SECONDI) { setPronto(true); clearInterval(id); }
    }, 5000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!pronto || !user || user.role === "admin" || leggi(LS_KEY)) return;
    api.get("/app-feedback/me")
      .then(({ data }) => { if (!data.given) setVisible(true); })
      .catch(() => {});
  }, [pronto, user]);

  if (!visible || !user) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const dismiss = () => {
    scrivi(LS_KEY, "1");
    setVisible(false);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/app-feedback", { stars, comment: comment.trim() || null });
      toast.success("Grazie per il tuo feedback! ⭐");
      scrivi(LS_KEY, "1");
      setVisible(false);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="app-feedback-banner"
      className="no-print fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-white/95 p-5 shadow-2xl shadow-ac-ink/25 backdrop-blur-xl"
    >
      <button
        data-testid="app-feedback-close"
        onClick={dismiss}
        aria-label="Chiudi"
        className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={18} />
      </button>
      <div className="text-sm font-bold text-foreground">Come valuti Sconti Roma?</div>
      <p className="mt-0.5 text-xs text-muted-foreground">Il tuo feedback ci aiuta a migliorare l'app.</p>
      <div className="mt-3 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            data-testid={`app-feedback-star-${n}`}
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} stelle`}
            className="inline-flex h-11 w-11 items-center justify-center transition-transform hover:scale-110"
          >
            <Star
              size={30}
              className={(hover || stars) >= n ? "text-gold" : "text-muted-foreground"}
              fill="currentColor"
            />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <div className="mt-3 space-y-3">
          <Textarea
            data-testid="app-feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            rows={2}
            placeholder="Vuoi dirci qualcosa in più? (facoltativo)"
            className="bg-muted border-border text-foreground text-sm"
          />
          <Button
            data-testid="app-feedback-submit"
            onClick={submit}
            disabled={busy}
            className="w-full rounded-full grad-fucsia-viola text-white"
          >
            {busy ? "Invio…" : "Invia feedback"}
          </Button>
        </div>
      )}
    </div>
  );
}
