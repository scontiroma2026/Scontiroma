import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/forgot", { email });
      setResult(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(result.reset_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main data-testid="forgot-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-white/10 bg-white/5 p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Recupero</div>
        <h1 className="mt-2 font-serif text-4xl text-white">ID o password dimenticati?</h1>
        <p className="mt-2 text-sm text-white/60">Recupera l'accesso in un attimo.</p>

        {!result ? (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="text-white/80">Email dell'account</Label>
              <Input data-testid="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-black/40 border-white/10 text-white" />
            </div>
            <Button data-testid="forgot-submit" type="submit" disabled={busy} className="w-full grad-fucsia-viola text-white rounded-full py-6">
              {busy ? "Invio…" : "Recupera accesso"}
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-fucsia/30 bg-fucsia/5 p-4 text-sm text-white/80">
              {result.message}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/60">
              <p>📧 Se questa email è registrata, riceverai un link per reimpostare la password entro pochi minuti.</p>
              <p className="mt-2">Controlla anche la cartella spam. Il link scade dopo 1 ora.</p>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-ciano hover:underline">← Torna al login</Link>
        </p>
      </Card>
    </main>
  );
}
