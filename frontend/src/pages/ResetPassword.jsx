import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [token, setToken] = useState(params.get("token") || "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw !== pw2) return toast.error("Le password non corrispondono");
    if (pw.length < 6) return toast.error("Almeno 6 caratteri");
    setBusy(true);
    try {
      await api.post("/auth/reset", { token, new_password: pw });
      toast.success("Password aggiornata! Ora accedi");
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <main data-testid="reset-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-white/10 bg-white/5 p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Nuova password</div>
        <h1 className="mt-2 font-serif text-4xl text-white">Imposta nuova password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label className="text-white/80">Codice di recupero</Label>
            <Input data-testid="reset-token" required value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 font-mono text-xs bg-black/40 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-white/80">Nuova password</Label>
            <PasswordInput data-testid="reset-pw" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 bg-black/40 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-white/80">Conferma</Label>
            <PasswordInput data-testid="reset-pw2" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} className="mt-1 bg-black/40 border-white/10 text-white" />
          </div>
          <Button data-testid="reset-submit" type="submit" disabled={busy} className="w-full grad-fucsia-viola text-white rounded-full py-6">
            {busy ? "Salvataggio…" : "Aggiorna password"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-ciano hover:underline">← Torna al login</Link>
        </p>
      </Card>
    </main>
  );
}
