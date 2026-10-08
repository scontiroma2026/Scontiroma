import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Scheda, CLASSE_PRIMARIO } from "@/components/AreaUI";

export const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const FASCIA = { apre: "09:00", chiude: "13:00" };
const VUOTO = () => GIORNI.map((_, i) => ({ chiuso: i === 6, fasce: i === 6 ? [] : [{ ...FASCIA }] }));

/**
 * Orari del negozio, scritti dal commerciante: i clienti vedono «Aperto ora» o
 * «Chiuso · apre…» sulla pagina dell'offerta. Una o due fasce al giorno; una fascia
 * che chiude prima di aprire finisce dopo mezzanotte (es. 19:30–01:00).
 */
export default function MerchantHours() {
  const { refresh } = useAuth();
  const [giorni, setGiorni] = useState(VUOTO);
  const [straordinaria, setStraordinaria] = useState(false);
  const [nota, setNota] = useState("");
  const [aggiornati, setAggiornati] = useState("");
  const [stato, setStato] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => {
        const o = (data.user || data).orari;
        if (!o) return;
        setGiorni(o.giorni);
        setStraordinaria(Boolean(o.chiusura_straordinaria));
        setNota(o.nota_chiusura || "");
        setAggiornati(o.aggiornati_il || "");
      })
      .catch(() => {});
  }, []);

  const cambia = (i, fn) => setGiorni((gg) => gg.map((g, j) => (j === i ? fn({ ...g, fasce: g.fasce.map((f) => ({ ...f })) }) : g)));
  const copiaLunedi = () => setGiorni((gg) => gg.map((g, i) => (i >= 1 && i <= 4 ? JSON.parse(JSON.stringify(gg[0])) : g)));

  const salva = async () => {
    setBusy(true);
    try {
      const { data } = await api.put("/merchants/me/hours", {
        giorni, chiusura_straordinaria: straordinaria, nota_chiusura: nota,
      });
      setAggiornati(data.orari.aggiornati_il);
      setStato(data.stato);
      refresh(); // aggiorna «Da fare»
      toast.success("Orari salvati: i clienti li vedono sulla tua offerta.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const ora = "h-11 w-[5.75rem] rounded-xl border border-ac-campo bg-white px-2 text-sm font-semibold text-ac-ink";

  return (
    <Scheda data-testid="merchant-hours" titolo="Orari del negozio" tono="viola" icona={<Clock size={15} />}>
      <p className="text-sm leading-relaxed text-ac-soft">
        Li scrivi tu: sulla tua offerta i clienti vedono «Aperto ora» o «Chiuso». Per chi chiude dopo
        mezzanotte basta scrivere, per esempio, 19:30 – 01:00.
      </p>

      <div className="mt-3 divide-y divide-ac-line">
        {giorni.map((g, i) => (
          <div key={GIORNI[i]} data-testid={`orari-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <span className="w-24 text-sm font-bold text-ac-ink">{GIORNI[i]}</span>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 pr-2 text-sm font-semibold text-ac-soft">
              <input
                data-testid={`orari-${i}-chiuso`}
                type="checkbox"
                checked={g.chiuso}
                onChange={(e) => cambia(i, (d) => ({ chiuso: e.target.checked, fasce: e.target.checked ? [] : [{ ...FASCIA }] }))}
                className="h-6 w-6 accent-ac-rosa"
              />
              Chiuso
            </label>
            {!g.chiuso && g.fasce.map((f, k) => (
              <span key={k} className="flex items-center gap-1">
                <input aria-label={`${GIORNI[i]}, apertura ${k + 1}`} data-testid={`orari-${i}-${k}-apre`} type="time" value={f.apre}
                  onChange={(e) => cambia(i, (d) => { d.fasce[k].apre = e.target.value; return d; })} className={ora} />
                <span className="text-ac-mute">–</span>
                <input aria-label={`${GIORNI[i]}, chiusura ${k + 1}`} data-testid={`orari-${i}-${k}-chiude`} type="time" value={f.chiude}
                  onChange={(e) => cambia(i, (d) => { d.fasce[k].chiude = e.target.value; return d; })} className={ora} />
                {k === 1 && (
                  <button type="button" aria-label="Togli la seconda fascia" onClick={() => cambia(i, (d) => { d.fasce.pop(); return d; })}
                    className="ml-1 flex h-11 w-11 items-center justify-center rounded-full text-ac-soft hover:bg-ac-tint"><X size={16} /></button>
                )}
              </span>
            ))}
            {!g.chiuso && g.fasce.length === 1 && (
              <button type="button" data-testid={`orari-${i}-aggiungi`} onClick={() => cambia(i, (d) => { d.fasce.push({ apre: "16:00", chiude: "20:00" }); return d; })}
                className="flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-extrabold text-ac-rosa hover:bg-ac-rosaSoft">
                <Plus size={14} /> seconda fascia
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={copiaLunedi} className="mt-1 min-h-11 text-sm font-bold text-ac-viola underline underline-offset-4">
        Copia gli orari del lunedì da martedì a venerdì
      </button>

      <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ac-ink">
        <input data-testid="orari-straordinaria" type="checkbox" checked={straordinaria}
          onChange={(e) => setStraordinaria(e.target.checked)} className="h-6 w-6 accent-ac-rosa" />
        Chiusura straordinaria (ferie, lavori)
      </label>
      {straordinaria && (
        <input data-testid="orari-nota" aria-label="Motivo della chiusura" value={nota} maxLength={120} onChange={(e) => setNota(e.target.value)}
          placeholder="Es. Chiusi per ferie fino al 20 agosto"
          className="mt-2 h-12 w-full rounded-xl border border-ac-campo bg-white px-3 text-base text-ac-ink" />
      )}

      <button type="button" data-testid="orari-salva" onClick={salva} disabled={busy} className={`${CLASSE_PRIMARIO} mt-5 w-full`}>
        {busy ? "Salvataggio…" : "Salva gli orari"}
      </button>
      {stato && <p data-testid="orari-stato" className="mt-3 text-sm text-ac-soft">Ora i clienti vedono: <strong className="text-ac-ink">{stato.testo}</strong></p>}
      {aggiornati && (
        <p className="mt-2 text-xs text-ac-mute">Ultimo aggiornamento: {new Date(aggiornati).toLocaleDateString("it-IT")}</p>
      )}
    </Scheda>
  );
}
