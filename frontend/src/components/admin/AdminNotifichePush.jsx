import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Scheda, CLASSE_PRIMARIO, CLASSE_BORDO, CLASSE_BASE_SECONDARIO } from "@/components/AreaUI";
import { pushSupportate, iscrizioneAttuale, creaIscrizione, MSG_PERMESSO_NEGATO } from "@/lib/push";

/**
 * «Notifiche su questo telefono»: notifiche push all'admin (nuovo commerciante, offerta da approvare,
 * nuovo cliente). Il service worker /sw-push.js si registra solo quando si tocca «Attiva notifiche».
 */
export default function AdminNotifichePush({ hdrs }) {
  const [attive, setAttive] = useState(false);
  const [occupato, setOccupato] = useState(false);
  const ok = pushSupportate();
  const permessoNegato = ok && Notification.permission === "denied";

  const aggiorna = useCallback(async () => {
    try {
      setAttive(!!(await iscrizioneAttuale()));
    } catch (_) {
      setAttive(false);
    }
  }, []);

  useEffect(() => { aggiorna(); }, [aggiorna]);

  const attiva = async () => {
    if (!ok) return;
    setOccupato(true);
    try {
      // Su iPhone il permesso va chiesto subito dopo il tocco, prima di ogni altra attesa (lo fa creaIscrizione).
      const iscrizione = await creaIscrizione(async () => {
        const { data } = await api.get("/admin/push/chiave-pubblica", hdrs ? hdrs() : undefined);
        return data.public_key;
      });
      await api.post("/admin/push/iscrizione", iscrizione, hdrs ? hdrs() : undefined);
      setAttive(true);
      toast.success("Notifiche attive su questo telefono");
    } catch (err) {
      if (err?.message === "permesso-negato") toast.error(MSG_PERMESSO_NEGATO);
      else toast.error(err?.response ? formatApiError(err) : "Non riesco ad attivare le notifiche su questo dispositivo.");
    } finally {
      setOccupato(false);
    }
  };

  const prova = async () => {
    setOccupato(true);
    try {
      const { data } = await api.post("/admin/push/prova", {}, hdrs ? hdrs() : undefined);
      if (data.inviate > 0) toast.success("Prova inviata: tra pochi secondi arriva la notifica");
      else toast.error("La prova non è partita: disattiva e riattiva le notifiche, poi riprova.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setOccupato(false);
    }
  };

  const disattiva = async () => {
    setOccupato(true);
    try {
      const iscrizione = await iscrizioneAttuale();
      if (iscrizione) {
        await api.delete("/admin/push/iscrizione", { ...(hdrs ? hdrs() : {}), data: { endpoint: iscrizione.endpoint } });
        await iscrizione.unsubscribe();
      }
      setAttive(false);
      toast.success("Notifiche disattivate su questo telefono");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setOccupato(false);
    }
  };

  return (
    <Scheda
      titolo="Notifiche su questo telefono"
      tono="viola"
      className="mb-4"
      destra={attive ? "Attive" : "Spente"}
      data-testid="scheda-notifiche-push"
    >
      <p className="text-sm text-ac-soft">
        Ricevi un avviso quando si iscrive un nuovo commerciante, quando c'è un'offerta da approvare e quando si iscrive
        un nuovo cliente. Toccando l'avviso si apre il pannello admin.
      </p>
      <p className="mt-2 text-sm text-ac-soft">
        Su iPhone funziona solo se apri Sconti Roma dall'icona sulla schermata Home (Safari → Condividi → Aggiungi alla
        schermata Home), iOS 16.4 o successivo.
      </p>
      {!ok && (
        <p className="mt-2 text-sm font-bold text-ac-rosso" data-testid="push-non-supportate">
          Questo browser non supporta le notifiche. Su iPhone apri Sconti Roma dall'icona sulla schermata Home.
        </p>
      )}
      {permessoNegato && (
        <p className="mt-2 text-sm font-bold text-ac-rosso">
          Le notifiche sono bloccate: riattivale nelle Impostazioni del telefono (Notifiche → Sconti Roma).
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {!attive && (
          <button type="button" onClick={attiva} disabled={!ok || occupato} data-testid="push-attiva" className={CLASSE_PRIMARIO}>
            Attiva notifiche
          </button>
        )}
        {attive && (
          <>
            <button type="button" onClick={prova} disabled={occupato} data-testid="push-prova" className={CLASSE_PRIMARIO}>
              Invia una prova
            </button>
            <button
              type="button"
              onClick={disattiva}
              disabled={occupato}
              data-testid="push-disattiva"
              className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola}`}
            >
              Disattiva
            </button>
          </>
        )}
      </div>
    </Scheda>
  );
}
