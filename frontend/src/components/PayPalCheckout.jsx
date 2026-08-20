import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";

/**
 * PayPal Subscription block. Carica la config dal backend (client_id, plan_id).
 * Se PayPal non è configurato mostra un placeholder informativo.
 */
export default function PayPalCheckout({ onSuccess }) {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/paypal/config")
      .then((r) => setCfg(r.data))
      .catch(() => setCfg({ enabled: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="animate-spin text-ciano" size={20} />
      </div>
    );
  }

  if (!cfg?.enabled) {
    return (
      <div
        data-testid="paypal-not-configured"
        className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100 flex gap-3"
      >
        <Info size={18} className="shrink-0 mt-0.5 text-yellow-300" />
        <div>
          <div className="font-medium text-yellow-100">PayPal in configurazione</div>
          <p className="text-yellow-200/80 mt-1 text-xs">
            Il pagamento PayPal sarà attivo appena le credenziali sandbox saranno inserite. Nel frattempo
            puoi abbonarti con carta di credito su Stripe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="paypal-buttons-wrapper" className="bg-white/5 rounded-xl p-4 border border-white/10">
      <PayPalScriptProvider
        options={{
          clientId: cfg.client_id,
          currency: "EUR",
          intent: "subscription",
          vault: true,
          components: "buttons",
        }}
      >
        <PayPalButtons
          style={{ shape: "pill", color: "gold", layout: "vertical", label: "subscribe" }}
          createSubscription={(_, actions) =>
            actions.subscription.create({ plan_id: cfg.plan_id })
          }
          onApprove={async (data) => {
            try {
              const r = await api.post("/paypal/activate", { subscription_id: data.subscriptionID });
              toast.success("Abbonamento PayPal attivato!");
              onSuccess?.(r.data.subscription);
            } catch (e) {
              toast.error(formatApiError(e));
            }
          }}
          onError={(err) => {
            console.error("PayPal error", err);
            toast.error("Errore PayPal — riprova o usa carta di credito.");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
