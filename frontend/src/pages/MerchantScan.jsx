import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, QrCode } from "lucide-react";

export default function MerchantScan() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null); // {status: 'ok'|'error', data|message}
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/redemptions/verify", { code: code.trim().toUpperCase() });
      setResult({ status: "ok", data: data.redemption });
      toast.success("Sconto validato!");
      setCode("");
    } catch (err) {
      setResult({ status: "error", message: formatApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main data-testid="merchant-scan-page" className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Verifica codice</div>
        <h1 className="mt-2 font-serif text-5xl">Scansiona lo sconto</h1>
        <p className="mt-2 text-white/70">Inserisci il codice del cliente per applicare lo sconto.</p>
      </div>

      <Card className="border-warm bg-[#141414] border border-white/10 p-8">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="code" className="flex items-center gap-2"><QrCode size={14} /> Codice sconto</Label>
            <Input
              id="code"
              data-testid="scan-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC12345"
              className="mt-1 text-center font-mono text-2xl tracking-[0.3em] uppercase"
              maxLength={12}
              required
            />
          </div>
          <Button
            data-testid="scan-verify-btn"
            type="submit"
            disabled={loading || !code}
            size="lg"
            className="w-full grad-fucsia-viola text-white hover:scale-105 transition"
          >
            {loading ? "Verifica…" : "Valida sconto"}
          </Button>
        </form>

        {result?.status === "ok" && (
          <div data-testid="scan-success" className="mt-6 rounded-lg border-2 border-terracotta bg-white/5 p-6">
            <div className="flex items-center gap-3 text-terracotta">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta text-white">
                <Check size={20} />
              </div>
              <div>
                <div className="font-serif text-2xl">Sconto applicato</div>
                <div className="text-sm text-white/70">Cliente: <strong>{result.data.client_name}</strong></div>
              </div>
            </div>
            <div className="mt-4 border-t border-warm pt-4 text-sm">
              <div className="text-white/60">Offerta</div>
              <div className="font-serif text-lg text-white">{result.data.discount_title}</div>
              <div className="mt-2 font-mono text-xs tracking-wider text-white/50">{result.data.code}</div>
            </div>
          </div>
        )}

        {result?.status === "error" && (
          <div data-testid="scan-error" className="mt-6 rounded-lg border-2 border-destructive bg-destructive/5 p-6">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-white">
                <X size={20} />
              </div>
              <div>
                <div className="font-serif text-2xl">Codice non valido</div>
                <div className="text-sm text-destructive/80">{result.message}</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
