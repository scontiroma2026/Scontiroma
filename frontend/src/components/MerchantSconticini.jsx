import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAppConfig } from "@/context/ConfigContext";
import { Stamp } from "lucide-react";
import { toast } from "sonner";
import { Scheda, Pillola, Scheletro, ErroreRiprova, CLASSE_PRIMARIO } from "@/components/AreaUI";

const data = (iso) => (iso ? new Date(iso).toLocaleDateString("it-IT") : "");
const STATI = { pending: ["ambra", "Da usare"], redeemed: ["verde", "Riscattato"], expired: ["rosso", "Scaduto"] };

/**
 * «Sconticini» del negozio (PROPOSTA, solo con SCONTICINI_ENABLED): il negozio decide quanti sconticini servono e quale
 * premio dà; il premio è a suo carico. Vede quanti premi sono sbloccati e riscattati (clienti come in cassa: «Mario R.»).
 */
export default function MerchantSconticini() {
  const { sconticini } = useAppConfig();
  const [d, setD] = useState(null);
  const [errore, setErrore] = useState(false);
  const [attivo, setAttivo] = useState(false);
  const [soglia, setSoglia] = useState(5);
  const [premio, setPremio] = useState("");
  const [accetto, setAccetto] = useState(false);
  const [busy, setBusy] = useState(false);

  const carica = useCallback(() => {
    setErrore(false);
    api.get("/merchants/me/sconticini").then(({ data: x }) => {
      setD(x);
      setAttivo(!!x.config.attivo);
      setSoglia(x.config.soglia || 5);
      setPremio(x.config.premio || "");
    }).catch(() => setErrore(true));
  }, []);
  useEffect(() => { if (sconticini) carica(); }, [sconticini, carica]);

  if (!sconticini) return null;

  const salva = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/merchants/me/sconticini", { attivo, soglia: Number(soglia), premio, accetto_regolamento: accetto });
      toast.success(attivo ? "Sconticini attivi" : "Impostazioni salvate");
      setAccetto(false);
      carica();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const lim = d?.config.limiti;
  const n = d?.numeri;
  return (
    <Scheda titolo="Sconticini" tono="viola" icona={<Stamp size={15} />} data-testid="merchant-sconticini">
      {errore ? (
        <ErroreRiprova onRiprova={carica}>Non riusciamo a caricare gli Sconticini.</ErroreRiprova>
      ) : !d ? (
        <Scheletro className="h-24 w-full" />
      ) : (
        <>
          <p className="text-sm font-medium text-ac-soft">
            Ogni sconto usato al banco dà al cliente uno sconticino per il tuo negozio. Quando arriva alla soglia che scegli tu,
            sblocca il premio che decidi tu. Il premio è offerto dal tuo negozio.
          </p>
          {d.config.sospeso_admin && (
            <p data-testid="sconticini-sospeso" className="mt-3 rounded-2xl bg-ac-ambraBg px-4 py-3 text-sm font-extrabold text-ac-ambra">
              Gli Sconticini del tuo negozio sono stati messi in pausa da Sconti Roma. Scrivici a info@scontiroma.it.
            </p>
          )}

          <form onSubmit={salva} className="mt-4 space-y-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-extrabold text-ac-ink">
              <input data-testid="sconticini-attivo" type="checkbox" checked={attivo} onChange={(e) => setAttivo(e.target.checked)} className="h-6 w-6 shrink-0 accent-[#6D4AFF]" />
              Partecipo agli Sconticini
            </label>
            <div>
              <label htmlFor="sconticini-soglia" className="block text-sm font-extrabold text-ac-ink">Quanti sconticini servono per il premio</label>
              <input id="sconticini-soglia" data-testid="sconticini-soglia" type="number" inputMode="numeric" min={lim.soglia_min} max={lim.soglia_max}
                value={soglia} onChange={(e) => setSoglia(e.target.value)}
                className="mt-1 h-12 w-28 rounded-xl border-2 border-ac-campo bg-white px-3 text-center text-lg font-extrabold focus:border-ac-viola focus:outline-none" />
              <span className="ml-2 text-xs text-ac-mute">da {lim.soglia_min} a {lim.soglia_max}</span>
            </div>
            <div>
              <label htmlFor="sconticini-premio" className="block text-sm font-extrabold text-ac-ink">Il premio</label>
              <input id="sconticini-premio" data-testid="sconticini-premio" type="text" maxLength={80} value={premio} onChange={(e) => setPremio(e.target.value)}
                placeholder="Per esempio: un caffè offerto dal negozio"
                className="mt-1 h-12 w-full rounded-xl border-2 border-ac-campo bg-white px-3 text-base font-semibold focus:border-ac-viola focus:outline-none" />
            </div>
            {attivo && !d.config.regolamento_accettato && (
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm font-semibold text-ac-ink">
                <input data-testid="sconticini-regolamento" type="checkbox" checked={accetto} onChange={(e) => setAccetto(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[#6D4AFF]" />
                <span>Ho letto e accetto il <Link to="/sconticini/regolamento" className="font-extrabold text-ac-viola underline">regolamento degli Sconticini</Link>: il premio è a carico del mio negozio.</span>
              </label>
            )}
            <p className="text-xs font-medium text-ac-mute">
              Le modifiche valgono per i premi futuri: i premi già sbloccati restano come erano. Un sconticino al giorno per cliente; il QR del premio vale {lim.premio_giorni} giorni e si usa una volta.
            </p>
            <button data-testid="sconticini-salva" type="submit" disabled={busy || premio.trim().length < 3 || (attivo && !d.config.regolamento_accettato && !accetto)} className={`${CLASSE_PRIMARIO} w-full disabled:opacity-50`}>
              {busy ? "Salvo…" : "Salva"}
            </button>
          </form>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Numero v={n.sconticini_assegnati} l="Sconticini dati" t="ins-sconticini" />
            <Numero v={n.clienti_con_tessera} l="Clienti con tessera" t="ins-tessere" />
            <Numero v={n.premi_sbloccati} l="Premi sbloccati" t="ins-sbloccati" />
            <Numero v={n.premi_riscattati} l="Premi riscattati" t="ins-riscattati" />
          </div>

          {d.premi.length > 0 && (
            <ul data-testid="sconticini-premi" className="mt-4 divide-y divide-ac-line">
              {d.premi.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-extrabold">{p.cliente} · {p.premio}</div>
                    <div className="text-xs text-ac-mute">
                      Sbloccato il {data(p.sbloccato_il)}{p.stato === "pending" ? ` · scade il ${data(p.scade_il)}` : p.stato === "redeemed" ? ` · riscattato il ${data(p.riscattato_il)}` : ""}
                    </div>
                  </div>
                  <Pillola tono={STATI[p.stato]?.[0] || "viola"} className="shrink-0">{STATI[p.stato]?.[1] || p.stato}</Pillola>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Scheda>
  );
}

function Numero({ v, l, t }) {
  return (
    <div data-testid={t} className="rounded-[14px] bg-ac-tint p-3 text-center">
      <div className="text-2xl font-extrabold text-ac-ink">{v}</div>
      <div className="text-[11px] font-semibold leading-tight text-ac-soft">{l}</div>
    </div>
  );
}
