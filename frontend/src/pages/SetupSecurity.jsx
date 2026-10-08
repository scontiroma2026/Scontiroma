import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppConfig } from "@/context/ConfigContext";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { ScanFace, Check, Sparkles } from "lucide-react";

/** Sicurezza: si entra con email e password; il Face ID è facoltativo (niente PIN dal 03/10). */
export default function SetupSecurity() {
  const { subscriptionRequired } = useAppConfig();
  const nav = useNavigate();
  const { user, refresh } = useAuth();
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);
  // Aperta dal "Il mio account" (?da=account): stessa pagina, ma per chi è già registrato.
  const [params] = useSearchParams();
  const fromAccount = params.get("da") === "account";
  const devices = user?.biometric_devices || 0;

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

  const backToAccount = () => nav(user?.role === "merchant" ? "/merchant/dashboard" : "/dashboard");

  const finish = () => {
    if (user?.role === "merchant") nav("/merchant/discount");
    else nav(subscriptionRequired ? "/subscribe" : "/discounts");
  };

  return (
    <main data-testid="setup-security-page" className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Sicurezza</div>
        <h1 className="mt-2 font-serif text-4xl text-foreground">Entra con un tocco</h1>
        <p className="mt-3 text-muted-foreground">
          {fromAccount
            ? "Attiva il Face ID su questo telefono."
            : "Attiva il Face ID: la prossima volta entri senza scrivere email e password."}
        </p>
      </div>

      <Card className="border-border bg-muted p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ciano/10 text-ciano">
            {bioEnrolled ? <Check size={22} /> : <ScanFace size={22} />}
          </div>
          <div>
            <div className="text-xs uppercase text-ciano tracking-wider">Facoltativo · Consigliato</div>
            <h2 className="font-serif text-2xl text-foreground">Face ID / Impronta</h2>
            <p className="text-xs text-muted-foreground">Se non funziona, entri sempre con email e password.</p>
          </div>
        </div>
        {devices > 0 && (
          <p data-testid="bio-status" className="mt-4 text-sm text-foreground/80">
            Face ID attivo su {devices === 1 ? "1 dispositivo" : `${devices} dispositivi`}.
          </p>
        )}
        {!bioEnrolled && (
          <Button
            data-testid="enroll-biometric-btn"
            onClick={enrollBiometric}
            disabled={busy}
            className="mt-4 w-full grad-ciano-fucsia text-white rounded-full py-6"
          >
            <Sparkles size={16} className="mr-2" /> {devices > 0 ? "Attiva Face ID su questo telefono" : "Attiva Face ID adesso"}
          </Button>
        )}
      </Card>

      {fromAccount ? (
        <div className="mt-6 flex justify-end">
          <Button data-testid="back-account" onClick={backToAccount} className="grad-fucsia-viola text-white rounded-full px-6">
            Torna al mio account
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex justify-between">
          <button data-testid="skip-security" onClick={finish} className="text-sm text-muted-foreground hover:text-foreground">
            Salta per ora
          </button>
          <Button data-testid="finish-security" onClick={finish} className="grad-fucsia-viola text-white rounded-full px-6">
            Continua →
          </Button>
        </div>
      )}
    </main>
  );
}
