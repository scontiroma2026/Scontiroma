import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Scheda, CLASSE_PRIMARIO, CLASSE_BORDO, CLASSE_BASE_SECONDARIO } from "@/components/AreaUI";
import { pushSupportate, iscrizioneAttuale, creaIscrizione, MSG_PERMESSO_NEGATO, FRASE_IPHONE } from "@/lib/push";

/**
 * Notifiche push per commercianti (`ruolo="merchant"`) e clienti (`ruolo="client"`).
 * Compare SOLO se sul server è acceso PUSH_UTENTI_ENABLED: con l'interruttore spento /api/push/stato risponde 404
 * e il riquadro non si vede. Stesso service worker (/sw-push.js) e stesse chiavi dell'admin.
 * Clienti: due consensi separati (servizio / offerte promozionali), entrambi spenti per impostazione predefinita.
 */
export default function NotifichePushUtente({ ruolo, className = "" }) {
  const [stato, setStato] = useState(null); // null = nascosto (interruttore spento o errore)
  const [attive, setAttive] = useState(false); // questo telefono è iscritto
  const [occupato, setOccupato] = useState(false);
  const [aree, setAree] = useState([]);
  const [bozzaOfferte, setBozzaOfferte] = useState(false);
  const [zone, setZone] = useState([]);
  const ok = pushSupportate();
  const permessoNegato = ok && Notification.permission === "denied";
  const cliente = ruolo === "client";

  const carica = useCallback(async () => {
    try {
      const { data } = await api.get("/push/stato");
      setStato(data);
      if (data.consenso) {
        setBozzaOfferte(!!data.consenso.offerte);
        setZone(data.consenso.zone || []);
      }
      try {
        setAttive(!!(await iscrizioneAttuale()));
      } catch (_) {
        setAttive(false);
      }
    } catch (_) {
      setStato(null);
    }
  }, []);

  useEffect(() => { carica(); }, [carica]);
  useEffect(() => {
    if (cliente && stato) api.get("/zones").then((r) => setAree(r.data.areas || [])).catch(() => setAree([]));
  }, [cliente, stato]);

  if (!stato) return null;
  const consenso = stato.consenso || { servizio: false, offerte: false, zone: [] };

  /** Iscrive questo telefono se non lo è già. Va chiamata subito dopo un tocco (su iPhone è obbligatorio). */
  const assicuraIscrizione = async () => {
    if (attive) return;
    const iscrizione = await creaIscrizione(async () => stato.public_key);
    await api.post("/push/iscrizione", iscrizione);
    setAttive(true);
  };

  const conErrori = async (fn) => {
    setOccupato(true);
    try {
      await fn();
    } catch (err) {
      if (err?.message === "permesso-negato") toast.error(MSG_PERMESSO_NEGATO);
      else toast.error(err?.response ? formatApiError(err) : "Non riesco ad attivare le notifiche su questo dispositivo.");
    } finally {
      setOccupato(false);
    }
  };

  const salvaConsenso = async (nuovo) => {
    const { data } = await api.put("/push/consenso", nuovo);
    setStato((s) => ({ ...s, consenso: data.consenso }));
    setZone(data.consenso.zone || []);
    setBozzaOfferte(!!data.consenso.offerte);
  };

  const attiva = () => conErrori(async () => {
    await assicuraIscrizione();
    toast.success("Notifiche attive su questo telefono");
  });

  const prova = () => conErrori(async () => {
    const { data } = await api.post("/push/prova", {});
    if (data.inviate > 0) toast.success("Prova inviata: tra pochi secondi arriva la notifica");
    else toast.error("La prova non è partita: disattiva e riattiva le notifiche, poi riprova.");
  });

  const disattivaQui = () => conErrori(async () => {
    const iscrizione = await iscrizioneAttuale();
    if (iscrizione) {
      await api.delete("/push/iscrizione", { data: { endpoint: iscrizione.endpoint } });
      await iscrizione.unsubscribe();
    }
    setAttive(false);
    toast.success("Notifiche disattivate su questo telefono");
  });

  const disattivaTutto = () => conErrori(async () => {
    await api.delete("/push/tutto");
    const iscrizione = await iscrizioneAttuale();
    if (iscrizione) await iscrizione.unsubscribe();
    setAttive(false);
    setStato((s) => ({ ...s, consenso: { servizio: false, offerte: false, zone: [] } }));
    setBozzaOfferte(false);
    setZone([]);
    toast.success("Tutte le notifiche sono spente");
  });

  const cambiaServizio = (valore) => conErrori(async () => {
    if (valore) await assicuraIscrizione();
    await salvaConsenso({ servizio: valore, offerte: consenso.offerte, zone: consenso.zone });
    toast.success(valore ? "Avvisi sul servizio attivi" : "Avvisi sul servizio spenti");
  });

  const cambiaOfferte = (valore) => {
    if (valore) {
      setBozzaOfferte(true); // si conferma con il pulsante, dopo aver scelto le zone
      return;
    }
    // Revoca immediata
    conErrori(async () => {
      await salvaConsenso({ servizio: consenso.servizio, offerte: false, zone: [] });
      toast.success("Notifiche sulle offerte spente");
    });
  };

  const confermaOfferte = () => conErrori(async () => {
    await assicuraIscrizione();
    await salvaConsenso({ servizio: consenso.servizio, offerte: true, zone });
    toast.success("Notifiche sulle offerte attive");
  });

  const cambiaZona = (valore) =>
    setZone((z) => (z.includes(valore) ? z.filter((x) => x !== valore) : [...z, valore]));

  return (
    <Scheda
      titolo={cliente ? "Notifiche" : "Notifiche su questo telefono"}
      tono="viola"
      destra={attive ? "Attive qui" : "Spente qui"}
      className={className}
      data-testid="scheda-notifiche-utente"
    >
      {!cliente && (
        <p className="text-sm text-ac-soft">
          Ricevi un avviso quando la tua offerta è approvata o va corretta, 3 giorni prima che scada e la sera, se
          quel giorno qualcuno ha usato il tuo sconto (solo il numero, mai i nomi). Toccando l'avviso si apre il tuo pannello.
        </p>
      )}
      {cliente && (
        <div className="space-y-3 text-sm text-ac-soft">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={!!consenso.servizio}
              disabled={!ok || occupato}
              onChange={(e) => cambiaServizio(e.target.checked)}
              data-testid="push-consenso-servizio"
            />
            <span>
              <b className="text-foreground">Avvisi sul servizio</b>: per esempio quando uno sconto che hai preso e non
              hai ancora usato sta per scadere.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={bozzaOfferte}
              disabled={!ok || occupato}
              onChange={(e) => cambiaOfferte(e.target.checked)}
              data-testid="push-consenso-offerte"
            />
            <span>
              <b className="text-foreground">Nuove offerte (promozionali)</b>: un avviso quando un negozio che segui con il
              cuore o un negozio nelle zone che scegli pubblica una nuova offerta. Al massimo una notifica al giorno, mai
              tra le 21:00 e le 9:00.
            </span>
          </label>
          {bozzaOfferte && (
            <div className="rounded-2xl bg-ac-tint p-3" data-testid="push-zone">
              <p className="mb-2 font-semibold text-foreground">Zone che ti interessano</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {aree.map((a) => (
                  <label key={a.value} className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4" checked={zone.includes(a.value)} onChange={() => cambiaZona(a.value)} />
                    <span>{a.label}</span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={confermaOfferte} disabled={!ok || occupato} data-testid="push-conferma-offerte" className={`mt-3 ${CLASSE_PRIMARIO}`}>
                {consenso.offerte ? "Salva le zone" : "Attiva le notifiche sulle offerte"}
              </button>
            </div>
          )}
          <p className="text-xs">
            Puoi cambiare idea quando vuoi: togli la spunta e smettiamo subito. Nelle notifiche non mettiamo mai i tuoi
            dati. Dettagli nella <Link to="/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      )}
      <p className="mt-2 text-sm text-ac-soft">{FRASE_IPHONE}</p>
      {!ok && (
        <p className="mt-2 text-sm font-bold text-ac-rosso" data-testid="push-utente-non-supportate">
          Questo browser non supporta le notifiche. Su iPhone apri Sconti Roma dall'icona sulla schermata Home.
        </p>
      )}
      {permessoNegato && (
        <p className="mt-2 text-sm font-bold text-ac-rosso">
          Le notifiche sono bloccate: riattivale nelle Impostazioni del telefono (Notifiche → Sconti Roma).
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {!cliente && !attive && (
          <button type="button" onClick={attiva} disabled={!ok || occupato} data-testid="push-utente-attiva" className={CLASSE_PRIMARIO}>
            Attiva notifiche
          </button>
        )}
        {cliente && !attive && (consenso.servizio || consenso.offerte) && (
          <button type="button" onClick={attiva} disabled={!ok || occupato} data-testid="push-utente-attiva" className={CLASSE_PRIMARIO}>
            Attiva anche su questo telefono
          </button>
        )}
        {attive && (
          <button type="button" onClick={prova} disabled={occupato} data-testid="push-utente-prova" className={CLASSE_PRIMARIO}>
            Invia una prova
          </button>
        )}
        {!cliente && attive && (
          <button type="button" onClick={disattivaQui} disabled={occupato} data-testid="push-utente-disattiva"
            className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola}`}>
            Disattiva
          </button>
        )}
        {cliente && (attive || consenso.servizio || consenso.offerte) && (
          <button type="button" onClick={disattivaTutto} disabled={occupato} data-testid="push-disattiva-tutto"
            className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola}`}>
            Disattiva tutto
          </button>
        )}
      </div>
    </Scheda>
  );
}
