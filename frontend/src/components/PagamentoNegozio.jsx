import { useCallback, useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Scheda, CLASSE_PRIMARIO } from "@/components/AreaUI";

/**
 * «Attiva il pagamento» dell'area commerciante: appare solo quando i pagamenti dei negozi sono accesi
 * (MERCHANT_PAYMENT_REQUIRED). Una sola conferma: poi l'addebito è automatico ogni 1° del mese.
 * I testi di riepilogo sono una proposta da far validare al consulente.
 */
const euro = (cent) => `${(cent / 100).toFixed(2).replace(".", ",")} €`;
const dataIt = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "");

export default function PagamentoNegozio() {
  const [st, setSt] = useState(null);
  const [accetto, setAccetto] = useState(false);
  const [metodo, setMetodo] = useState("carta");
  const [paypal, setPaypal] = useState(null);
  const [busy, setBusy] = useState(false);

  const carica = useCallback(() => {
    api.get("/merchant/pagamento").then((r) => setSt(r.data)).catch(() => setSt(null));
  }, []);

  useEffect(() => {
    carica();
    if (new URLSearchParams(window.location.search).get("pagamento") === "ok") {
      toast.success("Pagamento attivato. Non ti addebitiamo nulla prima della data indicata.");
      setTimeout(carica, 4000); // il sito riceve la conferma da Stripe pochi secondi dopo
    }
  }, [carica]);

  useEffect(() => {
    if (metodo === "paypal" && accetto && !paypal) {
      api.get("/merchant/pagamento/paypal/config").then((r) => setPaypal(r.data)).catch((e) => toast.error(formatApiError(e)));
    }
  }, [metodo, accetto, paypal]);

  if (!st || !st.attivo) return null;

  const paga = async () => {
    setBusy(true);
    try {
      const r = await api.post("/merchant/pagamento/stripe/checkout");
      window.location.href = r.data.checkout_url;
    } catch (e) {
      toast.error(formatApiError(e));
      setBusy(false);
    }
  };

  const disdici = async () => {
    if (!window.confirm(
      `Vuoi disdire?\n\nL'abbonamento non si rinnoverà.\n\nFino all'ultimo giorno del mese i clienti possono ancora usare il tuo sconto e devi rispettarlo. Il mese già pagato non viene rimborsato.`)) return;
    setBusy(true);
    try {
      const r = await api.post("/merchant/pagamento/disdici");
      toast.success(r.data.messaggio || "Disdetta registrata.");
      carica();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const secondario =
    "inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-ac-soft bg-white px-4 text-sm font-extrabold text-ac-ink transition hover:bg-ac-tint disabled:opacity-50";

  if (st.abbonamento?.stato === "active") {
    return (
      <Scheda titolo="Pagamento" tono="verde" className="mb-4" data-testid="pagamento-attivo">
        <p className="text-sm text-ac-ink">
          <strong>Pagamento attivo</strong> con {st.abbonamento.metodo === "paypal" ? "PayPal" : "carta"}: {euro(st.importo_cent)} al mese,
          addebitati automaticamente il 1° di ogni mese.
          {st.disdetta_da && <> Hai disdetto: dal {st.disdetta_da} non si rinnova più.</>}
        </p>
        {!st.disdetta_da && (
          <button type="button" data-testid="pagamento-disdici" disabled={busy} onClick={disdici} className={`${secondario} mt-3`}>
            Disdici
          </button>
        )}
      </Scheda>
    );
  }

  if (!st.primo_addebito) {
    return (
      <Scheda titolo="Pagamento" tono="teal" className="mb-4" data-testid="pagamento-presto">
        <p className="text-sm text-ac-ink">Potrai attivare il pagamento dopo che la tua prima offerta sarà pubblicata.</p>
      </Scheda>
    );
  }

  return (
    <Scheda titolo="Attiva il pagamento" tono="rosa" className="mb-4" data-testid="pagamento-attiva">
      <ul className="space-y-1 text-sm text-ac-ink">
        <li><strong>Importo:</strong> {euro(st.importo_cent)} al mese.</li>
        <li><strong>Primo addebito:</strong> il {dataIt(st.primo_addebito)}. Fino ad allora la prova è gratuita e non ti addebitiamo nulla.</li>
        <li><strong>Rinnovo:</strong> automatico ogni 1° del mese.</li>
        <li><strong>Disdetta:</strong> quando vuoi, ha effetto a fine mese; fino a quel giorno i clienti possono usare il tuo sconto e devi rispettarlo.</li>
        <li><strong>Mese pagato:</strong> non rimborsabile.</li>
      </ul>
      <label className="mt-3 flex items-start gap-2 text-sm text-ac-ink">
        <input type="checkbox" data-testid="pagamento-accetto" className="mt-1" checked={accetto} onChange={(e) => setAccetto(e.target.checked)} />
        <span>Confermo di aver letto queste condizioni e autorizzo l'addebito automatico mensile.</span>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" data-testid="pagamento-metodo-carta" onClick={() => setMetodo("carta")}
          className={`${secondario} ${metodo === "carta" ? "border-ac-rosa" : ""}`}>Carta</button>
        <button type="button" data-testid="pagamento-metodo-paypal" onClick={() => setMetodo("paypal")}
          className={`${secondario} ${metodo === "paypal" ? "border-ac-rosa" : ""}`}>PayPal</button>
      </div>
      {metodo === "carta" && (
        <button type="button" data-testid="pagamento-paga-carta" disabled={!accetto || busy} onClick={paga} className={`${CLASSE_PRIMARIO} mt-3 min-h-12 px-5 text-sm disabled:opacity-50`}>
          Continua con la carta
        </button>
      )}
      {metodo === "paypal" && accetto && paypal && (
        <div className="mt-3" data-testid="pagamento-paypal">
          <PayPalScriptProvider options={{ clientId: paypal.client_id, currency: "EUR", intent: "subscription", vault: true, components: "buttons" }}>
            <PayPalButtons
              style={{ shape: "pill", color: "gold", layout: "vertical", label: "subscribe" }}
              createSubscription={(_, actions) =>
                actions.subscription.create({ plan_id: paypal.plan_id, start_time: paypal.start_time, custom_id: paypal.custom_id })}
              onApprove={async (data) => {
                try {
                  await api.post("/merchant/pagamento/paypal/activate", { subscription_id: data.subscriptionID });
                  toast.success("Pagamento con PayPal attivato.");
                  carica();
                } catch (e) {
                  toast.error(formatApiError(e));
                }
              }}
              onError={() => toast.error("Errore PayPal: riprova o usa la carta.")}
            />
          </PayPalScriptProvider>
        </div>
      )}
      {metodo === "paypal" && !accetto && <p className="mt-3 text-xs text-ac-soft">Spunta la conferma per continuare.</p>}
    </Scheda>
  );
}
