import { useEffect, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/PasswordInput";
import { Lock, ShieldAlert, Fingerprint, KeyRound, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";

/**
 * Gate che richiede la Master Password prima di accedere alla dashboard admin.
 * Supporta: master password, sblocco biometrico (WebAuthn) e recupero via Recovery ID.
 */
export default function AdminGate({ onVerified }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [recoveryId, setRecoveryId] = useState("");
  const [sentMsg, setSentMsg] = useState("");

  useEffect(() => {
    api.get("/admin/session")
      .then(({ data }) => setBioAvailable(!!data.biometric_available))
      .catch(() => {});
  }, []);

  const unlock = (data) => {
    localStorage.setItem("admin_master_token", data.token);
    toast.success("Sblocco riuscito ✦");
    onVerified(data.token);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/admin/verify-master", { password: pw });
      setPw("");
      unlock(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const bioUnlock = async () => {
    setBusy(true);
    try {
      const { data: options } = await api.post("/admin/webauthn-master/begin");
      const assertion = await startAuthentication({ optionsJSON: options });
      const { data } = await api.post("/admin/webauthn-master/complete", { credential: assertion });
      unlock(data);
    } catch (err) {
      if (err?.name === "NotAllowedError") toast.error("Verifica biometrica annullata");
      else toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const sendRecovery = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/admin/master-forgot", { recovery_id: recoveryId });
      setSentMsg(data.message);
      toast.success("Email di reset inviata");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <Card className="border-white/10 bg-white/5 p-8">
        <div className="flex items-center gap-3 text-fucsia">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fucsia/20 glow-fucsia">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ciano">Area riservata</div>
            <h1 className="font-serif text-3xl text-white">{forgotMode ? "Recupero Master" : "Master Password"}</h1>
          </div>
        </div>

        {!forgotMode ? (
          <>
            <p className="mt-4 text-sm text-white/60">
              Inserisci la master password per accedere ai dati sensibili.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <PasswordInput
                data-testid="master-pw"
                placeholder="•••••••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
                className="bg-black/40 border-white/10 text-white"
              />
              <Button
                data-testid="master-submit"
                type="submit"
                disabled={busy || !pw}
                className="w-full grad-fucsia-viola text-white rounded-full py-6"
              >
                <Lock size={14} className="mr-2" /> {busy ? "Verifica…" : "Sblocca"}
              </Button>
            </form>
            {bioAvailable && (
              <Button
                data-testid="master-biometric-btn"
                type="button"
                variant="outline"
                disabled={busy}
                onClick={bioUnlock}
                className="mt-3 w-full rounded-full border-ciano/40 text-ciano hover:bg-ciano/10 py-6"
              >
                <Fingerprint size={16} className="mr-2" /> Sblocca con impronta / Face ID
              </Button>
            )}
            <button
              data-testid="master-forgot-link"
              type="button"
              onClick={() => { setForgotMode(true); setSentMsg(""); }}
              className="mt-5 block w-full text-center text-sm text-white/50 underline underline-offset-4 hover:text-fucsia transition-colors"
            >
              Master password dimenticata?
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-white/60">
              Inserisci il tuo <strong className="text-ciano">Recovery ID</strong> (formato SR-XXXX-XXXX-XXXX).
              Ti invieremo un link di reset all'email amministratore.
            </p>
            {sentMsg ? (
              <div data-testid="master-forgot-sent" className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-start gap-2">
                <MailCheck size={18} className="mt-0.5 shrink-0" /> {sentMsg}
              </div>
            ) : (
              <form onSubmit={sendRecovery} className="mt-6 space-y-4">
                <Input
                  data-testid="master-recovery-id"
                  placeholder="SR-XXXX-XXXX-XXXX"
                  value={recoveryId}
                  onChange={(e) => setRecoveryId(e.target.value.toUpperCase())}
                  autoFocus
                  className="bg-black/40 border-white/10 text-white tracking-widest"
                />
                <Button
                  data-testid="master-forgot-submit"
                  type="submit"
                  disabled={busy || recoveryId.trim().length < 8}
                  className="w-full grad-fucsia-viola text-white rounded-full py-6"
                >
                  <KeyRound size={14} className="mr-2" /> {busy ? "Invio…" : "Invia link di reset"}
                </Button>
              </form>
            )}
            <button
              data-testid="master-forgot-back"
              type="button"
              onClick={() => setForgotMode(false)}
              className="mt-5 flex w-full items-center justify-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Torna al login master
            </button>
          </>
        )}
      </Card>
    </main>
  );
}
