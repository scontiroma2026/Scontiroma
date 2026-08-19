import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import api from "@/lib/api";
import { Check, X, Loader2 } from "lucide-react";

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
      <div data-testid="qr-valid" className="fixed inset-0 flex flex-col items-center justify-center px-6" style={{background: "linear-gradient(135deg,#0E7A3A 0%,#1AB870 100%)"}}>
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
    <div data-testid="qr-invalid" className="fixed inset-0 flex flex-col items-center justify-center px-6" style={{background: "linear-gradient(135deg,#8B0F1F 0%,#DC2E4A 100%)"}}>
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl" style={{animation: "pop 0.4s ease-out"}}>
        <X size={72} className="text-red-600" strokeWidth={3} />
      </div>
      <h1 className="font-serif text-5xl text-white text-center leading-none">CODICE NON VALIDO<br/><span className="text-3xl">O GIÀ UTILIZZATO</span></h1>
      <p className="mt-8 max-w-sm rounded-2xl bg-white/15 backdrop-blur border border-white/20 px-5 py-3 text-white text-center">
        {result?.reason || "Chiedi al cliente di rigenerare il QR."}
      </p>
      <style>{`@keyframes pop { 0% {transform: scale(0)} 60% {transform: scale(1.15)} 100% {transform: scale(1)} }`}</style>
    </div>
  );
}
