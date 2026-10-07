import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";

export const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const FASCIA = { apre: "09:00", chiude: "13:00" };
const VUOTO = () => GIORNI.map((_, i) => ({ chiuso: i === 6, fasce: i === 6 ? [] : [{ ...FASCIA }] }));

/**
 * Orari del negozio, scritti dal commerciante: i clienti vedono «Aperto ora» o
 * «Chiuso · apre…» sulla pagina dell'offerta. Una o due fasce al giorno; una fascia
 * che chiude prima di aprire finisce dopo mezzanotte (es. 19:30–01:00).
 */
export default function MerchantHours() {
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
      toast.success("Orari salvati: i clienti li vedono sulla tua offerta.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const ora = "w-[5.5rem] rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm text-white";

  return (
    <Card data-testid="merchant-hours" className="border border-white/10 bg-[#141414] p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
        <Clock size={14} /> Orari del negozio
      </div>
      <p className="mt-2 text-sm text-white/70">
        Li scrivi tu: sulla tua offerta i clienti vedono «Aperto ora» o «Chiuso». Per chi chiude dopo
        mezzanotte basta scrivere, per esempio, 19:30 – 01:00.
      </p>

      <div className="mt-4 divide-y divide-white/10">
        {giorni.map((g, i) => (
          <div key={GIORNI[i]} data-testid={`orari-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <span className="w-24 text-sm font-semibold text-white">{GIORNI[i]}</span>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                data-testid={`orari-${i}-chiuso`}
                type="checkbox"
                checked={g.chiuso}
                onChange={(e) => cambia(i, (d) => ({ chiuso: e.target.checked, fasce: e.target.checked ? [] : [{ ...FASCIA }] }))}
                className="h-5 w-5 accent-fucsia"
              />
              Chiuso
            </label>
            {!g.chiuso && g.fasce.map((f, k) => (
              <span key={k} className="flex items-center gap-1">
                <input aria-label={`${GIORNI[i]}, apertura ${k + 1}`} data-testid={`orari-${i}-${k}-apre`} type="time" value={f.apre}
                  onChange={(e) => cambia(i, (d) => { d.fasce[k].apre = e.target.value; return d; })} className={ora} />
                <span className="text-white/50">–</span>
                <input aria-label={`${GIORNI[i]}, chiusura ${k + 1}`} data-testid={`orari-${i}-${k}-chiude`} type="time" value={f.chiude}
                  onChange={(e) => cambia(i, (d) => { d.fasce[k].chiude = e.target.value; return d; })} className={ora} />
                {k === 1 && (
                  <button type="button" aria-label="Togli la seconda fascia" onClick={() => cambia(i, (d) => { d.fasce.pop(); return d; })}
                    className="ml-1 rounded-full p-2 text-white/60 hover:bg-white/10"><X size={14} /></button>
                )}
              </span>
            ))}
            {!g.chiuso && g.fasce.length === 1 && (
              <button type="button" data-testid={`orari-${i}-aggiungi`} onClick={() => cambia(i, (d) => { d.fasce.push({ apre: "16:00", chiude: "20:00" }); return d; })}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-fucsia hover:bg-fucsia/10">
                <Plus size={12} /> seconda fascia
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={copiaLunedi} className="mt-2 text-xs text-ciano underline underline-offset-2">
        Copia gli orari del lunedì da martedì a venerdì
      </button>

      <label className="mt-5 flex items-center gap-2 text-sm text-white/80">
        <input data-testid="orari-straordinaria" type="checkbox" checked={straordinaria}
          onChange={(e) => setStraordinaria(e.target.checked)} className="h-5 w-5 accent-fucsia" />
        Chiusura straordinaria (ferie, lavori)
      </label>
      {straordinaria && (
        <input data-testid="orari-nota" value={nota} maxLength={120} onChange={(e) => setNota(e.target.value)}
          placeholder="Es. Chiusi per ferie fino al 20 agosto"
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white" />
      )}

      <Button data-testid="orari-salva" onClick={salva} disabled={busy} className="mt-5 w-full grad-fucsia-viola text-white">
        Salva gli orari
      </Button>
      {stato && <p data-testid="orari-stato" className="mt-3 text-sm text-white/80">Ora i clienti vedono: <strong>{stato.testo}</strong></p>}
      {aggiornati && (
        <p className="mt-2 text-xs text-white/50">Ultimo aggiornamento: {new Date(aggiornati).toLocaleDateString("it-IT")}</p>
      )}
    </Card>
  );
}
