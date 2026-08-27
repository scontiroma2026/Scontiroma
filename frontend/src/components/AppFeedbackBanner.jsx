import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, X } from "lucide-react";
import { toast } from "sonner";

const LS_KEY = "app_feedback_dismissed_v1";
const HIDDEN_PREFIXES = ["/locandina", "/admin", "/scan"];

/**
 * Banner in basso che chiede una valutazione a stelle sull'app.
 * Mostrato solo a utenti loggati (client/merchant) che non hanno ancora votato.
 */
export default function AppFeedbackBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    if (localStorage.getItem(LS_KEY)) return;
    api.get("/app-feedback/me")
      .then(({ data }) => { if (!data.given) setVisible(true); })
      .catch(() => {});
  }, [user]);

  if (!visible || !user) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const dismiss = () => {
    localStorage.setItem(LS_KEY, "1");
    setVisible(false);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/app-feedback", { stars, comment: comment.trim() || null });
      toast.success("Grazie per il tuo feedback! ⭐");
      localStorage.setItem(LS_KEY, "1");
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
      className="no-print fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/15 bg-[#18181d]/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl"
    >
      <button
        data-testid="app-feedback-close"
        onClick={dismiss}
        aria-label="Chiudi"
        className="absolute right-3 top-3 text-white/40 hover:text-white transition-colors"
      >
        <X size={18} />
      </button>
      <div className="text-sm font-bold text-white">Come valuti Sconti Roma?</div>
      <p className="mt-0.5 text-xs text-white/50">Il tuo feedback ci aiuta a migliorare l'app.</p>
      <div className="mt-3 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            data-testid={`app-feedback-star-${n}`}
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} stelle`}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={30}
              className={(hover || stars) >= n ? "text-gold" : "text-white/25"}
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
            className="bg-black/40 border-white/10 text-white text-sm"
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
