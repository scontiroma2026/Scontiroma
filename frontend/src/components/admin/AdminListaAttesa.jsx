import { useCallback, useEffect, useRef, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const NOMI_FONTE = { instagram: "Instagram", facebook: "Facebook", volantino: "Volantino", passaparola: "Passaparola", diretto: "Diretto", altro: "Altro" };
const MOTIVI = {
  tetto_giornaliero: "fermato al tetto giornaliero: riprova domani",
  errori: "fermato per errori di invio: controlla Resend e riprova",
  errore: "interrotto per un errore: riprova",
};

/** Scheda «Lista d'attesa»: conteggi, esportazione delle sole confermate e avviso di lancio (con parola di conferma). */
export default function AdminListaAttesa({ hdrs }) {
  const [d, setD] = useState(null);
  const timer = useRef(null);

  const carica = useCallback(() => api.get("/admin/lista-attesa", hdrs()).then((r) => {
    setD(r.data);
    return r.data;
  }).catch((e) => toast.error(formatApiError(e))), [hdrs]);

  useEffect(() => {
    carica();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caricamento una volta all'apertura della scheda
  }, []);

  // Mentre l'invio è in corso si aggiornano i numeri ogni 3 secondi.
  useEffect(() => {
    if (!d?.avviso?.in_corso) return undefined;
    timer.current = setTimeout(carica, 3000);
    return () => clearTimeout(timer.current);
  }, [d, carica]);

  const esporta = async () => {
    try {
      const r = await api.get("/admin/lista-attesa/esporta.csv", { ...hdrs(), responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = "lista-attesa-confermate.csv";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const invia = async () => {
    const parola = window.prompt(
      `Stai per mandare l'avviso «Sconti Roma è online» a ${d.avviso.da_avvisare} persone che hanno confermato la lista d'attesa. Chi l'ha già ricevuto non lo riceve due volte.\n\nScrivi AVVISA per confermare:`, "");
    if (parola === null) return;
    try {
      const r = await api.post("/admin/lista-attesa/invia-avviso", { conferma: parola }, hdrs());
      toast.success(r.data.avviato ? `Invio partito per ${r.data.da_inviare} persone` : "Nessuno da avvisare");
      carica();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!d) return <p className="text-muted-foreground">Caricamento…</p>;
  const a = d.avviso;
  return (
    <div data-testid="admin-lista-attesa" className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Box label="Da confermare" valore={d.da_confermare} testid="attesa-da-confermare" nota="cancellate dopo 7 giorni" />
        <Box label="Confermate" valore={d.confermate} testid="attesa-confermate" />
        <Box label="Disiscritte" valore={d.disiscritte} testid="attesa-disiscritte" />
      </div>

      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">Per fonte</h3>
        <p className="mt-1 text-xs text-muted-foreground">Da dove arrivano le iscrizioni (parametro del link). Nessun dato personale.</p>
        {d.per_fonte.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nessuna iscrizione ancora.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm text-foreground">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-semibold">Fonte</th>
                <th scope="col" className="py-2 text-right font-semibold">Da confermare</th>
                <th scope="col" className="py-2 text-right font-semibold">Confermate</th>
                <th scope="col" className="py-2 text-right font-semibold">Disiscritte</th>
              </tr>
            </thead>
            <tbody>
              {d.per_fonte.map((f) => (
                <tr key={f.fonte} data-testid="attesa-fonte-riga" className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3">{NOMI_FONTE[f.fonte] || f.fonte}</td>
                  <td className="py-2.5 text-right tabular-nums">{f.da_confermare}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">{f.confermata}</td>
                  <td className="py-2.5 text-right tabular-nums">{f.disiscritta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">Esportazione</h3>
        <p className="mt-1 text-xs text-muted-foreground">Un file CSV con le sole iscrizioni confermate (email, data del consenso, versione del testo, fonte).</p>
        <button type="button" data-testid="attesa-esporta" onClick={esporta}
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-input px-6 text-sm font-semibold text-foreground">
          Esporta le confermate (CSV)
        </button>
      </Card>

      <Card className="border-border bg-muted p-5">
        <h3 className="font-serif text-xl text-foreground">Avviso di lancio</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Manda «Sconti Roma è online» a chi ha confermato e non è stato ancora avvisato, a piccoli lotti con pause. Nessuno lo riceve due volte.
          Prima di premere controlla il limite giornaliero di Resend: qui è fissato a {a.tetto_giornaliero > 0 ? `${a.tetto_giornaliero} email al giorno` : "nessun tetto"}.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-foreground" data-testid="attesa-avviso-numeri">
          <span>Da avvisare: <strong data-testid="attesa-da-avvisare">{a.da_avvisare}</strong></span>
          <span>Già avvisate: <strong data-testid="attesa-avvisate">{a.avvisate}</strong></span>
          <span>Inviate oggi: <strong>{a.avvisate_oggi}</strong></span>
        </div>
        {a.in_corso && <p role="status" className="mt-2 text-sm text-foreground">Invio in corso…</p>}
        {a.ultimo && !a.in_corso && (
          <p data-testid="attesa-ultimo" className="mt-2 text-sm text-foreground/80">
            Ultimo invio: {a.ultimo.inviati ?? 0} inviate{a.ultimo.restano ? `, ne restano ${a.ultimo.restano}` : ""}
            {a.ultimo.fermato_per ? ` (${MOTIVI[a.ultimo.fermato_per] || a.ultimo.fermato_per})` : ""}.
          </p>
        )}
        <button type="button" data-testid="attesa-invia-avviso" onClick={invia} disabled={a.in_corso || a.da_avvisare === 0}
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-fucsia px-6 text-sm font-semibold text-white disabled:opacity-50">
          Invia l'avviso di lancio
        </button>
        {!d.modalita_prelancio && <p className="mt-2 text-xs text-muted-foreground">La modalità pre-lancio è spenta: il modulo di iscrizione non è visibile al pubblico.</p>}
      </Card>
    </div>
  );
}

function Box({ label, valore, nota, testid }) {
  return (
    <Card className="border-border bg-muted p-4">
      <div data-testid={testid} className="font-serif text-4xl text-foreground">{valore}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {nota && <div className="mt-1 text-[11px] text-muted-foreground">{nota}</div>}
    </Card>
  );
}
