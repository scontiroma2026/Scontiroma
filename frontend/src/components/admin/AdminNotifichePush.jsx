import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Scheda, CLASSE_PRIMARIO, CLASSE_BORDO, CLASSE_BASE_SECONDARIO } from "@/components/AreaUI";

/**
 * «Notifiche su questo telefono»: notifiche push all'admin (nuovo commerciante, offerta da approvare,
 * nuovo cliente). Il service worker /sw-push.js si registra solo qui, quando si tocca «Attiva notifiche».
 */
const SW_URL = "/sw-push.js";

function supportate() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function chiaveInByte(base64url) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const grezza = window.atob(b64);
  return Uint8Array.from(grezza, (c) => c.charCodeAt(0));
}

function stessaChiave(iscrizione, chiave) {
  try {
    const attuale = iscrizione?.options?.applicationServerKey;
    if (!attuale) return true; // il browser non la dice: si tiene l'iscrizione
    const a = new Uint8Array(attuale);
    return a.length === chiave.length && a.every((v, i) => v === chiave[i]);
  } catch (_) {
    return true;
  }
}

async function iscrizioneAttuale() {
  if (!supportate()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  if (!reg || !reg.active || !String(reg.active.scriptURL).endsWith(SW_URL)) return null;
  return reg.pushManager.getSubscription();
}

export default function AdminNotifichePush({ hdrs }) {
  const [attive, setAttive] = useState(false);
  const [occupato, setOccupato] = useState(false);
  const ok = supportate();
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
      // Su iPhone il permesso va chiesto subito dopo il tocco, prima di ogni altra attesa.
      const permesso = await Notification.requestPermission();
      if (permesso !== "granted") {
        toast.error("Permesso negato: abilita le notifiche per Sconti Roma nelle Impostazioni del telefono.");
        return;
      }
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
      await navigator.serviceWorker.ready;
      const { data } = await api.get("/admin/push/chiave-pubblica", hdrs ? hdrs() : undefined);
      const chiave = chiaveInByte(data.public_key);
      let iscrizione = await reg.pushManager.getSubscription();
      if (iscrizione && !stessaChiave(iscrizione, chiave)) {
        await iscrizione.unsubscribe();
        iscrizione = null;
      }
      if (!iscrizione) {
        iscrizione = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiave });
      }
      const j = iscrizione.toJSON();
      await api.post("/admin/push/iscrizione", { endpoint: j.endpoint, keys: j.keys }, hdrs ? hdrs() : undefined);
      setAttive(true);
      toast.success("Notifiche attive su questo telefono");
    } catch (err) {
      toast.error(err?.response ? formatApiError(err) : "Non riesco ad attivare le notifiche su questo dispositivo.");
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
