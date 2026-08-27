import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import api from "@/lib/api";
import { Check, Loader2, Ban } from "lucide-react";

export default function QRVerify() {
  const params = useParams();
  const [sp] = useSearchParams();
  const token = params.token || sp.get("token") || "";
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); setResult({ valid: false, reason: "Codice mancante" }); return; }
    api.get(`/qr/verify?token=${encodeURIComponent(token)}`)
      .then((r) => setResult(r.data))
      .catch(() => setResult({ valid: false, reason: "Errore di verifica" }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A] text-white">
        <Loader2 size={48} className="animate-spin text-fucsia" />
      </div>
    );
  }

  const now = new Date();

  if (result?.valid) {
    return (
      <div data-testid="qr-valid" className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6" style={{background: "linear-gradient(135deg,#0E7A3A 0%,#1AB870 100%)"}}>
        <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl" style={{animation: "pop 0.4s ease-out"}}>
          <Check size={72} className="text-emerald-600" strokeWidth={3} />
        </div>
        <h1 className="font-serif text-6xl text-white text-center leading-none">ABBONAMENTO<br/>VALIDO</h1>
        <div className="mt-8 w-full max-w-sm rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 p-6 text-white text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Cliente</div>
          <div className="mt-1 font-serif text-3xl">{result.client_name}</div>
          <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white/70">Sconto</div>
          <div className="mt-1 font-serif text-2xl leading-tight">{result.discount_title}</div>
          <div className="mt-1 text-lg text-white/80">{result.shop_name}</div>
          {result.discount_percent && (
            <div className="mt-4 inline-block rounded-full bg-white text-emerald-700 px-4 py-1.5 font-bold text-lg">
              −{result.discount_percent}%
            </div>
          )}
          {result.max_uses > 1 && (
            <div data-testid="usage-summary" className="mt-4 rounded-xl bg-black/25 px-4 py-2.5 text-sm">
              <div className="font-bold">Utilizzo {result.use_number} di {result.max_uses} questo mese</div>
              {result.prev_used_at && (
                <div className="mt-0.5 text-xs text-white/75">
                  Utilizzo precedente: {new Date(result.prev_used_at).toLocaleDateString("it-IT")}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-white/80">
          Applica lo sconto e concludi il pagamento.
        </p>
        <p className="mt-1 text-xs text-white/60">
          {now.toLocaleDateString("it-IT")} · {now.toLocaleTimeString("it-IT", {hour:'2-digit', minute:'2-digit'})}
        </p>
        <style>{`@keyframes pop { 0% {transform: scale(0)} 60% {transform: scale(1.15)} 100% {transform: scale(1)} }`}</style>
      </div>
    );
  }

  return (
    <div data-testid="qr-invalid" className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 py-8 overflow-y-auto" style={{background: "linear-gradient(135deg,#8B0F1F 0%,#DC2E4A 100%)"}}>
      {/* Giant prohibition icon */}
      <div className="mb-6 relative">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-2xl" style={{animation: "pop 0.4s ease-out"}}>
          <Ban size={104} className="text-red-600" strokeWidth={2.5} />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" style={{animationDuration: "1.6s"}} />
      </div>

      {/* Huge uppercase warning */}
      <h1 className="font-serif text-5xl md:text-6xl uppercase text-white text-center leading-[0.95] tracking-tight max-w-3xl">
        Attenzione
      </h1>
      <h2 className="mt-3 font-serif text-3xl md:text-4xl uppercase text-white text-center leading-tight tracking-tight max-w-3xl">
        Sconto <span className="underline decoration-4 underline-offset-4">non applicabile</span>
      </h2>

      {/* Full explanation */}
      <div className="mt-8 w-full max-w-lg rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-5 text-white text-center">
        {result?.daily_limit || (result?.reason || "").toLowerCase().includes("giornaliero") ? (
          <>
            <p className="text-lg font-bold uppercase leading-snug" data-testid="daily-limit-msg">
              Limite giornaliero raggiunto:<br/>il cliente ha già usato questo sconto oggi.
            </p>
            <div className="my-4 h-px bg-white/25" />
            <p className="text-base font-semibold leading-snug">
              Gli utilizzi multipli valgono <span className="uppercase">1 al giorno</span>.<br/>
              <span className="text-2xl uppercase tracking-wide">Applicare il prezzo pieno del menu.</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold uppercase leading-snug">
              L'utente non risulta abbonato<br/>o il codice è scaduto.
            </p>
            <div className="my-4 h-px bg-white/25" />
            <p className="text-base font-semibold leading-snug">
              Riscandere un nuovo codice<br/>
              <span className="text-2xl uppercase tracking-wide">o applicare il prezzo pieno del menu.</span>
            </p>
          </>
        )}
      </div>

      {/* Small staff note */}
      <div className="mt-6 w-full max-w-lg rounded-xl border-2 border-white/35 bg-black/25 backdrop-blur px-4 py-3 text-white/95 text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/80 mb-1 font-bold">Nota per il personale</div>
        <p className="text-xs leading-relaxed">
          Non applicare lo sconto manualmente per evitare ammanchi di cassa non autorizzati.
        </p>
      </div>

      {/* Debug reason (dev only) */}
      {result?.reason && (
        <div className="mt-4 text-[10px] uppercase tracking-widest text-white/50" data-testid="qr-invalid-reason">
          {result.reason}
        </div>
      )}

      <style>{`@keyframes pop { 0% {transform: scale(0)} 60% {transform: scale(1.15)} 100% {transform: scale(1)} }`}</style>
    </div>
  );
}
