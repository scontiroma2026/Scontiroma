import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { startAuthentication } from "@simplewebauthn/browser";
import { ScanFace, KeyRound, Mail, ArrowLeft, Loader2 } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import BrandMark from "@/components/BrandMark";

export default function Login() {
  const { login, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState("email"); // email | password
  const [email, setEmail] = useState(localStorage.getItem("last_email") || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoTried, setAutoTried] = useState(false);
  // Il tentativo automatico non deve mostrare errori: il ref è sempre aggiornato (lo stato no, dentro goBiometric)
  const autoRef = useRef(false);
  // «Usa un altro account» annulla il Face ID automatico, anche se è già partito
  const cambiato = useRef(false);
  // Accesso bloccato dal server dopo 5 tentativi sbagliati: fino a quando (ms) e minuti rimasti.
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const locked = lockedUntil > now;
  const lockMinutes = Math.max(1, Math.ceil((lockedUntil - now) / 60000));
  useEffect(() => {
    if (!lockedUntil) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  // Il blocco riguarda un solo account: cambiando email non deve restare.
  const changeEmail = (v) => { setEmail(v); setLockedUntil(0); };
  // «Usa un altro account»: dimentica l'ultimo account usato su questo telefono.
  const switchAccount = () => {
    cambiato.current = true;
    try { localStorage.removeItem("last_email"); } catch (_) { /* localStorage non disponibile */ }
    setEmail(""); setPassword(""); setLockedUntil(0); setStep("email");
  };

  const goBiometric = async () => {
    if (!email) return toast.error("Inserisci l'email");
    localStorage.setItem("last_email", email);
    setBusy(true);
    try {
      const { data: options } = await api.post("/webauthn/login/begin", { email });
      const assertion = await startAuthentication({ optionsJSON: options });
      const { data } = await api.post("/webauthn/login/complete", { credential: assertion });
      // Cookie httpOnly già impostato dal backend — niente localStorage per il JWT (anti-XSS).
      await refresh();
      toast.success("Bentornato! ✦");
      nav(data.user.role === "merchant" ? "/merchant/dashboard" : data.user.role === "admin" ? "/admin" : "/discounts");
    } catch (e) {
      if (cambiato.current) return;
      // Face ID non riuscito → si passa a email e password (in silenzio se era il tentativo automatico)
      const isNotAllowed = e?.name === "NotAllowedError" || e?.name === "InvalidStateError";
      if (!autoRef.current && !isNotAllowed) {
        const msg = formatApiError(e) || "Face ID non disponibile";
        toast.error(msg);
      }
      setStep("password");
    } finally {
      setBusy(false);
    }
  };

  // Auto-tentativo Face ID all'apertura se abbiamo l'email dell'ultimo login
  useEffect(() => {
    if (autoTried) return;
    const lastEmail = localStorage.getItem("last_email");
    if (!lastEmail) return;
    if (!window.PublicKeyCredential) return; // browser senza WebAuthn
    setAutoTried(true);
    autoRef.current = true;
    // piccolo delay per permettere al render di stabilizzarsi
    const t = setTimeout(() => { if (!cambiato.current) goBiometric().finally(() => { autoRef.current = false; }); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-tentativo Face ID SOLO al mount: rieseguirlo su cambio deps aprirebbe prompt biometrici indesiderati
  }, []);

  const submitPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) {
      setPassword("");
      const m = /Riprova tra (\d+)\s*minut/.exec(res.error || "");
      if (m) {
        setLockedUntil(Date.now() + parseInt(m[1], 10) * 60000);
        setNow(Date.now());
        return;
      }
      return toast.error(res.error);
    }
    try { localStorage.setItem("last_email", email); } catch (_) { /* localStorage non disponibile */ }
    toast.success(`Bentornato, ${res.user.name}`);
    nav(res.user.role === "merchant" ? "/merchant/dashboard" : res.user.role === "admin" ? "/admin" : "/discounts");
  };

  return (
    <main data-testid="login-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-border bg-muted backdrop-blur p-8">
        {step === "email" && (
          <>
            <div className="text-xs uppercase tracking-[0.2em] text-ciano">Bentornato</div>
            <h1 className="mt-2 font-serif text-4xl text-foreground inline-flex items-center gap-3 flex-wrap justify-center">
              Entra in <BrandMark inline className="text-4xl" />
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Con Face ID entri con un tocco, oppure con email e password.</p>

            <div className="mt-8 space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground/80">Email</Label>
                <div className="relative mt-1">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    data-testid="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => changeEmail(e.target.value)}
                    className="pl-9 bg-muted border-border text-foreground"
                    autoComplete="username"
                  />
                </div>
              </div>

              <button
                data-testid="face-id-btn"
                onClick={goBiometric}
                disabled={!email || busy}
                className="group relative w-full overflow-hidden rounded-3xl border-2 border-fucsia bg-gradient-to-br from-muted to-transparent p-6 text-foreground transition hover:scale-[1.01] hover:glow-fucsia disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl grad-fucsia-viola glow-fucsia">
                    {busy ? <Loader2 className="animate-spin" size={28} /> : <ScanFace size={32} className="animate-pulse" />}
                  </div>
                  <div className="text-left">
                    <div className="font-serif text-2xl">Accedi con Face ID</div>
                    <div className="text-xs text-muted-foreground">Impronta o riconoscimento facciale</div>
                  </div>
                </div>
              </button>

              <button
                data-testid="use-pw-btn"
                onClick={() => setStep("password")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm text-foreground hover:bg-muted transition"
              >
                <KeyRound size={14} /> Accedi con email e password
              </button>

              {email && (
                <div className="pt-1 text-center text-xs">
                  <button type="button" data-testid="switch-account" onClick={switchAccount} className="text-muted-foreground hover:text-foreground hover:underline">
                    Non sei tu? Usa un altro account
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {step === "password" && (
          <>
            <button onClick={() => setStep("email")} className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> indietro
            </button>
            <h1 className="font-serif text-4xl text-foreground">Email e password</h1>
            {locked && (
              <div data-testid="login-locked" role="alert" className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-800">
                <strong className="block text-red-800">Accesso bloccato per sicurezza</strong>
                Troppi tentativi sbagliati. Riprova tra {lockMinutes} {lockMinutes === 1 ? "minuto" : "minuti"},
                oppure usa "Password dimenticata?" per crearne una nuova.
              </div>
            )}
            <form onSubmit={submitPassword} className="mt-6 space-y-4" autoComplete="on">
              <div>
                <Label className="text-foreground/80">Email</Label>
                <Input
                  data-testid="login-email-pw"
                  type="email"
                  required
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => changeEmail(e.target.value)}
                  className="mt-1 bg-muted border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground/80">Password</Label>
                <PasswordInput
                  data-testid="login-password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 bg-muted border-border text-foreground"
                />
              </div>
              <Button data-testid="login-submit" type="submit" disabled={busy || locked} className="w-full grad-fucsia-viola text-white rounded-full py-6">
                {busy ? "Accesso…" : "Accedi"}
              </Button>
              <div className="text-center text-xs">
                <Link to="/forgot-password" className="text-ciano hover:underline">Password dimenticata?</Link>
              </div>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Non hai un account? <Link to="/register" className="text-fucsia hover:underline">Registrati</Link>
        </p>
      </Card>
    </main>
  );
}
