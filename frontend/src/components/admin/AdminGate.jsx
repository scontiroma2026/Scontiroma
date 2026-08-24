import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/PasswordInput";
import { Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

/**
 * Gate che richiede la Master Password prima di accedere alla dashboard admin.
 * Chiama `onVerified(token)` quando il backend restituisce un master token valido.
 */
export default function AdminGate({ onVerified }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/admin/verify-master", { password: pw });
      localStorage.setItem("admin_master_token", data.token);
      toast.success("Sblocco riuscito ✦");
      setPw("");
      onVerified(data.token);
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
            <h1 className="font-serif text-3xl text-white">Master Password</h1>
          </div>
        </div>
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
      </Card>
    </main>
  );
}
