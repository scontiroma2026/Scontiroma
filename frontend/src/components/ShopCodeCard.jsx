import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Scheda, Scheletro, ErroreRiprova, CLASSE_BASE_SECONDARIO, CLASSE_BORDO } from "@/components/AreaUI";

/**
 * «Codice del negozio»: 4 cifre che il titolare dà a chi lavora al banco. Il dipendente inquadra il QR del
 * cliente, scrive il codice e solo allora vede il nome del cliente. Cambiandolo, il vecchio smette di valere
 * (anche sui telefoni «ricordati»).
 */
export default function ShopCodeCard() {
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState(false);
  const [conferma, setConferma] = useState(false);
  const [busy, setBusy] = useState(false);

  const carica = useCallback(() => {
    setErrore(false);
    api.get("/merchants/me/shop-code").then(({ data }) => setDati(data)).catch(() => setErrore(true));
  }, []);
  useEffect(() => { carica(); }, [carica]);

  const cambia = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/merchants/me/shop-code/regenerate");
      setDati(data);
      setConferma(false);
      toast.success("Nuovo codice attivo. Il vecchio non vale più.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Scheda titolo="Codice del negozio" tono="teal" icona={<KeyRound size={15} />} data-testid="shop-code-card">
      {errore ? (
        <ErroreRiprova onRiprova={carica}>Non riusciamo a caricare il codice.</ErroreRiprova>
      ) : !dati ? (
        <Scheletro className="h-16 w-full" />
      ) : (
        <>
          <p className="text-sm font-medium text-ac-soft">
            Dallo a chi lavora al banco. Quando inquadra il QR di un cliente, scrive questo codice e applica lo sconto.
          </p>
          <div data-testid="shop-code-value" aria-label={`Codice del negozio ${dati.code.split("").join(" ")}`}
            className="my-3 rounded-2xl bg-ac-tealBg py-3 text-center font-testo text-[40px] font-extrabold leading-none tracking-[0.35em] text-ac-teal">
            {dati.code}
          </div>
          {!conferma ? (
            <button type="button" data-testid="shop-code-change" onClick={() => setConferma(true)}
              className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.teal} w-full`}>
              Cambia codice
            </button>
          ) : (
            <div role="alert" className="rounded-2xl border border-ac-line bg-ac-tint p-3">
              <p className="text-sm font-semibold text-ac-ink">
                Il codice attuale smette di valere subito, anche sui telefoni che lo ricordano. Vuoi cambiarlo?
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" data-testid="shop-code-confirm" onClick={cambia} disabled={busy}
                  className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.teal} flex-1`}>
                  {busy ? "Cambio…" : "Sì, cambia codice"}
                </button>
                <button type="button" onClick={() => setConferma(false)} disabled={busy}
                  className={`${CLASSE_BASE_SECONDARIO} flex-1 text-ac-soft`}>
                  Annulla
                </button>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs font-medium text-ac-mute">
            Se qualcuno lascia il negozio, cambia il codice. Dopo 5 errori il codice si blocca per 15 minuti.
          </p>
        </>
      )}
    </Scheda>
  );
}
