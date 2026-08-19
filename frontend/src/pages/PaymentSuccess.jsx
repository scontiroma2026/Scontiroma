import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("polling"); // polling | paid | timeout
  const { refresh } = useAuth();
  const tries = useRef(0);
  const nav = useNavigate();

  useEffect(() => {
    if (!sessionId) return;
    const poll = async () => {
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setStatus("paid");
          await refresh();
          return;
        }
      } catch {}
      tries.current += 1;
      if (tries.current > 10) { setStatus("timeout"); return; }
      setTimeout(poll, 2000);
    };
    poll();
  }, [sessionId, refresh]);

  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-white">
      <Card className="border-white/10 bg-white/5 p-10 text-center">
        {status === "polling" && (
          <>
            <Loader2 size={48} className="mx-auto animate-spin text-fucsia" />
            <h1 className="mt-6 font-serif text-4xl">Confermiamo il pagamento…</h1>
            <p className="mt-2 text-white/60">Solo qualche secondo.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full grad-fucsia-viola glow-fucsia text-white">
              <Check size={32} />
            </div>
            <h1 className="mt-6 font-serif text-5xl text-grad">Sei dei nostri! ✦</h1>
            <p className="mt-3 text-white/70">Il tuo abbonamento Sconti Roma è attivo. Roma ti aspetta.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={() => nav("/discounts")} className="grad-fucsia-viola text-white rounded-full px-6">
                Vai agli sconti →
              </Button>
              <Button variant="outline" onClick={() => nav("/dashboard")} className="rounded-full border-white/20 text-white hover:bg-white/10">
                Il mio account
              </Button>
            </div>
          </>
        )}
        {status === "timeout" && (
          <>
            <h1 className="font-serif text-3xl">Verifica in corso…</h1>
            <p className="mt-3 text-white/70">Il pagamento potrebbe richiedere ancora qualche istante.</p>
            <Link to="/dashboard" className="mt-4 inline-block text-ciano hover:underline">Vai al tuo account →</Link>
          </>
        )}
      </Card>
    </main>
  );
}
