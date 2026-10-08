import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, QrCode } from "lucide-react";
import { Scheda, CLASSE_PRIMARIO } from "@/components/AreaUI";

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
    <main data-testid="merchant-scan-page" className="text-ac-ink">
      <section className="bg-ac-rosaSoft">
        <div className="mx-auto max-w-xl px-4 pb-6 pt-8 text-center sm:px-6">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ac-viola">Verifica codice</div>
          <h1 className="mt-2 text-[32px] leading-[1.1] sm:text-5xl">Scansiona lo sconto</h1>
          <p className="mt-2 text-base font-medium text-ac-soft">Inserisci il codice del cliente per applicare lo sconto.</p>
        </div>
      </section>

      <div className="mx-auto max-w-xl px-4 pb-10 pt-4 sm:px-6">
        <Scheda className="!p-5 sm:!p-7">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="code" className="flex items-center gap-2 text-sm font-extrabold text-ac-rosa">
                <QrCode size={16} aria-hidden="true" /> Codice sconto
              </Label>
              <Input
                id="code"
                data-testid="scan-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC12345"
                autoComplete="off"
                autoCapitalize="characters"
                className="mt-2 h-16 rounded-2xl border-2 border-ac-campo bg-white text-center font-testo text-2xl font-extrabold uppercase tracking-[0.3em] text-ac-ink placeholder:font-semibold placeholder:tracking-[0.2em] placeholder:text-ac-campo focus-visible:border-ac-viola focus-visible:ring-0 md:text-2xl"
                maxLength={12}
                required
              />
            </div>
            <button
              data-testid="scan-verify-btn"
              type="submit"
              disabled={loading || !code}
              className={`${CLASSE_PRIMARIO} min-h-14 w-full`}
            >
              {loading ? "Verifica…" : "Valida sconto"}
            </button>
          </form>

          <div aria-live="polite">
            {result?.status === "ok" && (
              <div data-testid="scan-success" className="mt-6 rounded-2xl border-2 border-ac-verde bg-ac-verdeBg p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ac-verde text-white">
                    <Check size={22} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif text-2xl font-bold text-ac-verde">Sconto applicato</div>
                    <div className="text-sm text-ac-soft">Cliente: <strong className="text-ac-ink">{result.data.client_name}</strong></div>
                  </div>
                </div>
                <div className="mt-4 border-t border-ac-verde/30 pt-4 text-sm">
                  <div className="font-semibold text-ac-soft">Offerta</div>
                  <div className="break-words font-serif text-lg font-bold text-ac-ink">{result.data.discount_title}</div>
                  <div className="mt-2 font-testo text-xs font-bold tracking-wider text-ac-mute">{result.data.code}</div>
                </div>
              </div>
            )}

            {result?.status === "error" && (
              <div data-testid="scan-error" className="mt-6 rounded-2xl border-2 border-ac-rosso bg-ac-rossoBg p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ac-rosso text-white">
                    <X size={22} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif text-2xl font-bold text-ac-rosso">Codice non valido</div>
                    <div className="text-sm font-semibold text-ac-ink">{result.message}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Scheda>
      </div>
    </main>
  );
}
