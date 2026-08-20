import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { ScanFace, KeyRound, Check, Sparkles } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

export default function SetupSecurity() {
  const nav = useNavigate();
  const { user, refresh } = useAuth();
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);

  const savePin = async (e) => {
    e.preventDefault();
    if (pin !== pinConfirm) return toast.error("I due PIN non corrispondono");
    if (!/^\d{6}$/.test(pin)) return toast.error("Il PIN deve essere di 6 cifre");
    setBusy(true);
    try {
      await api.post("/auth/pin", { pin });
      setPinSaved(true);
      toast.success("PIN impostato ✓");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  const enrollBiometric = async () => {
    if (!browserSupportsWebAuthn()) {
      toast.error("Questo browser non supporta la biometria");
      return;
    }
    setBusy(true);
    try {
      const { data: options } = await api.post("/webauthn/register/begin");
      const cred = await startRegistration({ optionsJSON: options });
      await api.post("/webauthn/register/complete", { credential: cred });
      setBioEnrolled(true);
      await refresh();
      toast.success("Face ID attivato ✦");
    } catch (e) {
      const msg = formatApiError(e) || (e?.name === "NotAllowedError" ? "Registrazione annullata" : e?.message || "Errore");
      toast.error(msg);
    } finally { setBusy(false); }
  };

  const finish = () => {
    if (user?.role === "merchant") nav("/merchant/discount");
    else nav("/subscribe");
  };

  return (
    <main data-testid="setup-security-page" className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Un ultimo passo</div>
        <h1 className="mt-2 font-serif text-5xl text-white">Rendi l'accesso <span className="italic text-grad">più rapido</span></h1>
        <p className="mt-3 text-white/70">Imposta un PIN e attiva il Face ID: mai più email e password.</p>
      </div>

      {/* Step 1: PIN */}
      <Card className={`border-white/10 bg-white/5 p-6 ${pinSaved ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fucsia/20 text-fucsia">
            {pinSaved ? <Check size={22} /> : <KeyRound size={22} />}
          </div>
          <div>
            <div className="text-xs uppercase text-ciano tracking-wider">Passo 1</div>
            <h2 className="font-serif text-2xl text-white">Codice PIN a 6 cifre</h2>
            <p className="text-xs text-white/60">Usalo se il Face ID non funziona</p>
          </div>
        </div>
        {!pinSaved && (
          <form onSubmit={savePin} className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/80">Nuovo PIN</Label>
              <PasswordInput
                data-testid="pin-new"
                inputMode="numeric" maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g,""))}
                className="mt-1 text-center text-2xl tracking-[0.4em] font-mono bg-black/40 border-white/10 text-white py-5"
              />
            </div>
            <div>
              <Label className="text-white/80">Conferma</Label>
              <PasswordInput
                data-testid="pin-confirm"
                inputMode="numeric" maxLength={6}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g,""))}
                className="mt-1 text-center text-2xl tracking-[0.4em] font-mono bg-black/40 border-white/10 text-white py-5"
              />
            </div>
            <Button data-testid="pin-save" type="submit" disabled={busy || pin.length !== 6} className="col-span-2 grad-fucsia-viola text-white rounded-full">
              Salva PIN
            </Button>
          </form>
        )}
      </Card>

      {/* Step 2: Biometric */}
      <Card className={`mt-4 border-white/10 bg-white/5 p-6 ${!pinSaved ? "opacity-40 pointer-events-none" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ciano/20 text-ciano">
            {bioEnrolled ? <Check size={22} /> : <ScanFace size={22} />}
          </div>
          <div>
            <div className="text-xs uppercase text-ciano tracking-wider">Passo 2 · Consigliato</div>
            <h2 className="font-serif text-2xl text-white">Face ID / Impronta</h2>
            <p className="text-xs text-white/60">Accesso istantaneo, sicuro. Zero password.</p>
          </div>
        </div>
        {!bioEnrolled && (
          <Button
            data-testid="enroll-biometric-btn"
            onClick={enrollBiometric}
            disabled={busy || !pinSaved}
            className="mt-4 w-full grad-ciano-fucsia text-white rounded-full py-6"
          >
            <Sparkles size={16} className="mr-2" /> Attiva Face ID adesso
          </Button>
        )}
      </Card>

      <div className="mt-6 flex justify-between">
        <button data-testid="skip-security" onClick={finish} className="text-sm text-white/60 hover:text-white">
          Salta per ora
        </button>
        <Button data-testid="finish-security" onClick={finish} disabled={!pinSaved} className="grad-fucsia-viola text-white rounded-full px-6">
          Continua →
        </Button>
      </div>
    </main>
  );
}
