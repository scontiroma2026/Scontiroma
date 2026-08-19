import { useEffect, useState } from "react";
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

export default function Login() {
  const { login, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState("email"); // email | biometric | pin | password
  const [email, setEmail] = useState(localStorage.getItem("last_email") || "");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const goBiometric = async () => {
    if (!email) return toast.error("Inserisci l'email");
    localStorage.setItem("last_email", email);
    setBusy(true);
    try {
      const { data: options } = await api.post("/webauthn/login/begin", { email });
      const assertion = await startAuthentication({ optionsJSON: options });
      const { data } = await api.post("/webauthn/login/complete", { credential: assertion });
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      await refresh();
      toast.success("Bentornato! ✦");
      nav(data.user.role === "merchant" ? "/merchant/dashboard" : data.user.role === "admin" ? "/admin" : "/discounts");
    } catch (e) {
      const msg = formatApiError(e) || (e?.name === "NotAllowedError" ? "Scansione annullata o non riuscita" : "Face ID non disponibile");
      toast.error(msg);
      setStep("pin");
    } finally {
      setBusy(false);
    }
  };

  const submitPin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/pin-login", { email, pin });
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      await refresh();
      toast.success("Accesso effettuato");
      nav(data.user.role === "merchant" ? "/merchant/dashboard" : data.user.role === "admin" ? "/admin" : "/discounts");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Bentornato, ${res.user.name}`);
    nav(res.user.role === "merchant" ? "/merchant/dashboard" : res.user.role === "admin" ? "/admin" : "/discounts");
  };

  return (
    <main data-testid="login-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-white/10 bg-white/5 backdrop-blur p-8">
        {step === "email" && (
          <>
            <div className="text-xs uppercase tracking-[0.2em] text-ciano">Bentornato</div>
            <h1 className="mt-2 font-serif text-4xl text-white">Entra in Sconti Roma</h1>
            <p className="mt-2 text-sm text-white/60">Usa la scansione del volto per un accesso lampo.</p>

            <div className="mt-8 space-y-4">
              <div>
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <div className="relative mt-1">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    id="email"
                    data-testid="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-black/40 border-white/10 text-white"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                data-testid="face-id-btn"
                onClick={goBiometric}
                disabled={!email || busy}
                className="group relative w-full overflow-hidden rounded-3xl border-2 border-fucsia bg-gradient-to-br from-fucsia/20 to-transparent p-6 text-white transition hover:scale-[1.01] hover:glow-fucsia disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl grad-fucsia-viola glow-fucsia">
                    {busy ? <Loader2 className="animate-spin" size={28} /> : <ScanFace size={32} className="animate-pulse" />}
                  </div>
                  <div className="text-left">
                    <div className="font-serif text-2xl">Accedi con Face ID</div>
                    <div className="text-xs text-white/60">Impronta o riconoscimento facciale</div>
                  </div>
                </div>
              </button>

              <button
                data-testid="use-pin-btn"
                onClick={() => setStep("pin")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm text-white hover:bg-white/5 transition"
              >
                <KeyRound size={14} /> Accedi con codice PIN
              </button>

              <div className="pt-3 text-center text-xs text-white/50">
                Sei un commerciante o admin?{" "}
                <button data-testid="use-pw-btn" onClick={() => setStep("password")} className="text-ciano hover:underline">
                  Usa email e password
                </button>
              </div>
            </div>
          </>
        )}

        {step === "pin" && (
          <>
            <button onClick={() => setStep("email")} className="mb-4 flex items-center gap-1 text-xs text-white/60 hover:text-white">
              <ArrowLeft size={12} /> indietro
            </button>
            <h1 className="font-serif text-4xl text-white">Il tuo PIN</h1>
            <p className="mt-2 text-sm text-white/60">4 cifre per {email || "il tuo account"}</p>
            <form onSubmit={submitPin} className="mt-6 space-y-4">
              <Input
                data-testid="pin-input"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g,""))}
                className="text-center text-3xl tracking-[0.5em] font-mono bg-black/40 border-white/10 text-white py-6"
                autoFocus
              />
              <Button data-testid="pin-submit" type="submit" disabled={pin.length !== 4 || busy} className="w-full grad-fucsia-viola text-white rounded-full py-6">
                {busy ? "Attendi…" : "Entra"}
              </Button>
              <div className="text-center text-xs">
                <Link to="/forgot-password" className="text-ciano hover:underline">PIN o password dimenticati?</Link>
              </div>
            </form>
          </>
        )}

        {step === "password" && (
          <>
            <button onClick={() => setStep("email")} className="mb-4 flex items-center gap-1 text-xs text-white/60 hover:text-white">
              <ArrowLeft size={12} /> indietro
            </button>
            <h1 className="font-serif text-4xl text-white">Email e password</h1>
            <form onSubmit={submitPassword} className="mt-6 space-y-4">
              <div>
                <Label className="text-white/80">Email</Label>
                <Input data-testid="login-email-pw" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-black/40 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/80">Password</Label>
                <Input data-testid="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-black/40 border-white/10 text-white" />
              </div>
              <Button data-testid="login-submit" type="submit" disabled={busy} className="w-full grad-fucsia-viola text-white rounded-full py-6">
                {busy ? "Accesso…" : "Accedi"}
              </Button>
              <div className="text-center text-xs">
                <Link to="/forgot-password" className="text-ciano hover:underline">Password dimenticata?</Link>
              </div>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-white/60">
          Non hai un account? <Link to="/register" className="text-fucsia hover:underline">Registrati</Link>
        </p>
      </Card>
    </main>
  );
}
