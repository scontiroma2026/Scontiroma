import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";
import { Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";

/**
 * Recupero PIN in 2 step:
 *  1) Inserisci email → arriva un codice OTP a 6 cifre via Resend
 *  2) Inserisci il codice + nuovo PIN a 6 cifre → conferma
 */
export default function ForgotPin() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState("request"); // request | verify | done
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Inserisci la tua email");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/pin-forgot", { email });
      toast.success(data.message || "Se l'email è registrata, riceverai un codice a 6 cifre");
      setStep("verify");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  const verifyAndReset = async (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) return toast.error("I due PIN non corrispondono");
    if (!/^\d{6}$/.test(newPin)) return toast.error("Il PIN deve essere di 6 cifre");
    if (!/^\d{6}$/.test(code)) return toast.error("Il codice deve essere di 6 cifre");
    setBusy(true);
    try {
      await api.post("/auth/pin-reset", { email, code, new_pin: newPin });
      setStep("done");
      toast.success("PIN aggiornato ✓");
      setTimeout(() => nav("/login"), 1200);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <main data-testid="forgot-pin-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-white/10 bg-white/5 backdrop-blur p-8">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
          <ArrowLeft size={12} /> torna al login
        </Link>

        {step === "request" && (
          <>
            <div className="text-xs uppercase tracking-[0.2em] text-fucsia">Recupero PIN</div>
            <h1 className="mt-2 font-serif text-4xl text-white">Ti mandiamo <span className="italic text-grad">un codice</span></h1>
            <p className="mt-2 text-sm text-white/60">Inserisci l'email del tuo account. Ti arriverà un codice a 6 cifre valido 10 minuti.</p>
            <form onSubmit={requestCode} className="mt-6 space-y-4">
              <div>
                <Label className="text-white/80">Email</Label>
                <div className="relative mt-1">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    data-testid="forgot-pin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-black/40 border-white/10 text-white"
                  />
                </div>
              </div>
              <Button data-testid="forgot-pin-send" type="submit" disabled={busy} className="w-full grad-fucsia-viola text-white rounded-full py-6">
                {busy ? <><Loader2 className="animate-spin mr-2" size={16}/> Invio…</> : "Invia il codice"}
              </Button>
            </form>
          </>
        )}

        {step === "verify" && (
          <>
            <div className="text-xs uppercase tracking-[0.2em] text-ciano">Passo 2 di 2</div>
            <h1 className="mt-2 font-serif text-4xl text-white">Inserisci il codice</h1>
            <p className="mt-2 text-sm text-white/60">Controlla la casella <strong className="text-white">{email}</strong>. Se non ti arriva, controlla anche lo spam.</p>
            <form onSubmit={verifyAndReset} className="mt-6 space-y-4">
              <div>
                <Label className="text-white/80">Codice a 6 cifre</Label>
                <Input
                  data-testid="forgot-pin-code"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g,""))}
                  className="mt-1 text-center text-2xl tracking-[0.5em] font-mono bg-black/40 border-white/10 text-white py-5"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/80">Nuovo PIN</Label>
                  <PasswordInput
                    data-testid="forgot-pin-new"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g,""))}
                    className="mt-1 text-center text-xl tracking-[0.4em] font-mono bg-black/40 border-white/10 text-white py-4"
                  />
                </div>
                <div>
                  <Label className="text-white/80">Conferma PIN</Label>
                  <PasswordInput
                    data-testid="forgot-pin-confirm"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g,""))}
                    className="mt-1 text-center text-xl tracking-[0.4em] font-mono bg-black/40 border-white/10 text-white py-4"
                  />
                </div>
              </div>
              <Button
                data-testid="forgot-pin-submit"
                type="submit"
                disabled={busy || code.length !== 6 || newPin.length !== 6}
                className="w-full grad-fucsia-viola text-white rounded-full py-6"
              >
                {busy ? "Aggiorno…" : "Reimposta PIN"}
              </Button>
              <button type="button" onClick={() => setStep("request")} className="w-full text-center text-xs text-ciano hover:underline">
                Non ho ricevuto il codice, invialo di nuovo
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-8" data-testid="forgot-pin-success">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full grad-fucsia-viola">
              <KeyRound className="text-white" size={28} />
            </div>
            <h1 className="mt-6 font-serif text-3xl text-white">PIN aggiornato ✓</h1>
            <p className="mt-2 text-sm text-white/60">Ora puoi accedere con il nuovo PIN.</p>
          </div>
        )}
      </Card>
    </main>
  );
}
