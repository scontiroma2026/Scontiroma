import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CalendarClock, Download, Pencil, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import {
  Scheda, Pillola, StatoVuoto, ErroreRiprova, Scheletro,
  CLASSE_PRIMARIO, CLASSE_BASE_SECONDARIO, CLASSE_BORDO,
} from "@/components/AreaUI";

const BASE = "/admin/pagamenti-commercianti";
const METODI = [["bonifico", "Bonifico"], ["paypal", "PayPal"], ["contanti", "Contanti"], ["altro", "Altro"]];
const STATI = {
  in_prova: { testo: "In prova", tono: "viola" },
  attivo: { testo: "Attivo", tono: "verde" },
  scaduto: { testo: "Scaduto", tono: "rosso" },
  sospeso: { testo: "Sospeso", tono: "ambra" },
};
const CAMPO = "min-h-11 w-full rounded-xl border border-ac-campo bg-white px-3 text-base text-ac-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac-viola";
const ETICHETTA = "mb-1 block text-xs font-extrabold text-ac-soft";

const data = (iso) => {
  if (!iso) return "—";
  const [a, m, g] = iso.split("-");
  return `${g}/${m}/${a}`;
};
const euro = (s) => `${String(s).replace(".", ",")} €`;
const metodoEtichetta = (m) => (METODI.find(([k]) => k === m) || [null, m])[1];

/**
 * Pagamenti dei commercianti: registro MANUALE. Il titolare incassa come vuole e annota qui.
 * Nulla viene addebitato, nessuna email parte e il commerciante non vede alcun cambiamento.
 */
export default function AdminPayments({ hdrs }) {
  const [d, setD] = useState(null);
  const [errore, setErrore] = useState(false);
  const [cerca, setCerca] = useState("");
  const [registra, setRegistra] = useState(null); // commerciante per cui si registra il pagamento
  const [modifica, setModifica] = useState(null); // commerciante da modificare

  const carica = useCallback(async () => {
    setErrore(false);
    try {
      const h = hdrs ? hdrs() : undefined;
      const [elenco, riep, rin, sc, pag] = await Promise.all([
        api.get(`${BASE}/commercianti`, h), api.get(`${BASE}/riepilogo`, h), api.get(`${BASE}/rinnovi`, h),
        api.get(`${BASE}/scaduti`, h), api.get(BASE, h),
      ]);
      setD({
        oggi: elenco.data.oggi, suggerito: elenco.data.importo_suggerito, commercianti: elenco.data.commercianti,
        riepilogo: riep.data, rinnovi: rin.data.rinnovi, prove: rin.data.prove_in_scadenza, scaduti: sc.data.scaduti,
        pagamenti: pag.data.pagamenti,
      });
    } catch (e) {
      setErrore(true);
    }
  }, [hdrs]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- caricamento una volta all'apertura della scheda
  useEffect(() => { carica(); }, []);

  const filtrati = useMemo(() => {
    if (!d) return [];
    const ago = cerca.trim().toLowerCase();
    return ago ? d.commercianti.filter((c) => c.negozio.toLowerCase().includes(ago)) : d.commercianti;
  }, [d, cerca]);

  const annulla = async (p) => {
    if (!window.confirm(`Annullare il pagamento di ${euro(p.importo)} di «${p.negozio}»? Resta nel registro come annullato.`)) return;
    try {
      await api.delete(`${BASE}/${p.id}`, hdrs ? hdrs() : undefined);
      toast.success("Pagamento annullato");
      carica();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const esporta = async () => {
    try {
      const r = await api.get(`${BASE}/esporta.csv`, { ...(hdrs ? hdrs() : {}), responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pagamenti-commercianti.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(formatApiError(e)); }
  };

  return (
    <div data-testid="admin-pagamenti" className="space-y-4 text-ac-ink">
      <p data-testid="pagamenti-nota" className="rounded-2xl border border-ac-line bg-ac-tint px-4 py-3 text-sm font-semibold text-ac-soft">
        Registro manuale: qui annoti i pagamenti che incassi. Non addebita nulla.
      </p>

      {errore && <ErroreRiprova onRiprova={carica} data-testid="pagamenti-errore">Non riusciamo a caricare i pagamenti.</ErroreRiprova>}
      {!errore && !d && (
        <div data-testid="pagamenti-caricamento" className="space-y-3" role="status" aria-label="Caricamento">
          <Scheletro className="h-24" /><Scheletro className="h-32" /><Scheletro className="h-32" />
        </div>
      )}

      {d && (
        <>
          <Scheda
            titolo={`Riepilogo di ${d.riepilogo.mese_etichetta}`} tono="viola" data-testid="pagamenti-riepilogo"
            destra={<button type="button" data-testid="pag-esporta" onClick={esporta}
              className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola}`}><Download size={16} /> Esporta CSV</button>}
          >
            <div className="grid grid-cols-2 gap-3">
              <Numero etichetta="Incassato nel mese" valore={euro(d.riepilogo.totale)} testid="riep-totale" />
              <Numero etichetta="Pagamenti registrati" valore={d.riepilogo.numero_pagamenti} testid="riep-numero" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(STATI).map(([k, s]) => (
                <div key={k} className="rounded-xl bg-ac-tint px-3 py-2">
                  <div data-testid={`riep-stato-${k}`} className="font-serif text-2xl text-ac-ink">{d.riepilogo.commercianti_per_stato[k] ?? 0}</div>
                  <div className="text-xs font-bold text-ac-soft">{s.testo}</div>
                </div>
              ))}
            </div>
          </Scheda>

          <Scheda titolo="Rinnovi nei prossimi 30 giorni" tono="verde" icona={<CalendarClock size={15} />} data-testid="blocco-rinnovi">
            {d.rinnovi.length === 0 && d.prove.length === 0 ? (
              <StatoVuoto tono="verde" icona={<CalendarClock size={22} />}>Nessun rinnovo in arrivo nei prossimi 30 giorni.</StatoVuoto>
            ) : (
              <ul className="space-y-2">
                {d.rinnovi.map((c) => (
                  <Riga key={c.merchant_id} c={c} testid={`rinnovo-${c.merchant_id}`}
                    dettaglio={`Rinnovo il ${data(c.prossimo_rinnovo)}${c.giorni_al_rinnovo === 0 ? " (oggi)" : ` · tra ${c.giorni_al_rinnovo} giorni`}`}
                    azione={<button type="button" data-testid={`registra-rinnovo-${c.merchant_id}`} onClick={() => setRegistra(c)}
                      className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.teal}`}><Plus size={16} /> Registra pagamento</button>} />
                ))}
                {d.prove.map((c) => (
                  <Riga key={`p-${c.merchant_id}`} c={c} testid={`prova-${c.merchant_id}`}
                    dettaglio={`La prova finisce il ${data(c.prova_fino_al)}`}
                    azione={<button type="button" data-testid={`registra-prova-${c.merchant_id}`} onClick={() => setRegistra(c)}
                      className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.teal}`}><Plus size={16} /> Registra pagamento</button>} />
                ))}
              </ul>
            )}
          </Scheda>

          <Scheda titolo="Scaduti da rinnovare" tono="rosso" icona={<TriangleAlert size={15} />} data-testid="blocco-scaduti">
            {d.scaduti.length === 0 ? (
              <StatoVuoto tono="verde" icona={<Banknote size={22} />}>Nessun commerciante scaduto: è tutto in regola.</StatoVuoto>
            ) : (
              <ul className="space-y-2">
                {d.scaduti.map((c) => (
                  <Riga key={c.merchant_id} c={c} testid={`scaduto-${c.merchant_id}`}
                    dettaglio={c.prossimo_rinnovo ? `Scaduto il ${data(c.prossimo_rinnovo)}` : `Prova finita il ${data(c.prova_fino_al)}`}
                    azione={<button type="button" data-testid={`registra-scaduto-${c.merchant_id}`} onClick={() => setRegistra(c)}
                      className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.rosa}`}><Plus size={16} /> Registra pagamento</button>} />
                ))}
              </ul>
            )}
          </Scheda>

          <Scheda titolo={`Commercianti (${d.commercianti.length})`} tono="rosa" data-testid="blocco-commercianti">
            <div className="mb-3"><AdminSearchInput value={cerca} onChange={setCerca} placeholder="Cerca un negozio…" testId="pag-cerca" /></div>
            {d.commercianti.length === 0 ? (
              <StatoVuoto tono="viola">Nessun commerciante iscritto ancora.</StatoVuoto>
            ) : filtrati.length === 0 ? (
              <StatoVuoto tono="viola">Nessun negozio con questo nome.</StatoVuoto>
            ) : (
              <ul className="space-y-3">
                {filtrati.map((c) => (
                  <li key={c.merchant_id} data-testid={`commerciante-${c.merchant_id}`} className="rounded-2xl border border-ac-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 break-words text-base font-extrabold text-ac-ink">{c.negozio}</div>
                      <Stato stato={c.stato} testid={`stato-${c.merchant_id}`} />
                    </div>
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-ac-soft sm:grid-cols-3">
                      <div><dt className="inline font-bold">Fine prova: </dt><dd className="inline" data-testid={`prova-data-${c.merchant_id}`}>{data(c.prova_fino_al)}</dd></div>
                      <div><dt className="inline font-bold">Prossimo rinnovo: </dt><dd className="inline" data-testid={`rinnovo-data-${c.merchant_id}`}>{data(c.prossimo_rinnovo)}</dd></div>
                      <div><dt className="inline font-bold">Ultimo pagamento: </dt>
                        <dd className="inline" data-testid={`ultimo-${c.merchant_id}`}>
                          {c.ultimo_pagamento ? `${data(c.ultimo_pagamento.data)} · ${euro(c.ultimo_pagamento.importo)}` : "nessuno"}
                        </dd></div>
                    </dl>
                    {c.note && <p className="mt-2 break-words text-sm text-ac-soft">Note: {c.note}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" data-testid={`registra-${c.merchant_id}`} onClick={() => setRegistra(c)}
                        className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.teal}`}><Plus size={16} /> Registra pagamento</button>
                      <button type="button" data-testid={`modifica-${c.merchant_id}`} onClick={() => setModifica(c)}
                        className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola}`}><Pencil size={16} /> Modifica</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Scheda>

          <Scheda titolo="Pagamenti registrati" tono="teal" icona={<Banknote size={15} />} data-testid="blocco-pagamenti">
            {d.pagamenti.length === 0 ? (
              <StatoVuoto tono="teal" icona={<Banknote size={22} />}>Nessun pagamento registrato ancora.</StatoVuoto>
            ) : (
              <ul className="space-y-2">
                {d.pagamenti.map((p) => {
                  const annullato = p.stato === "annullato";
                  return (
                    <li key={p.id} data-testid={`pagamento-${p.id}`} className="rounded-2xl border border-ac-line p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className={`min-w-0 break-words text-base font-extrabold ${annullato ? "text-ac-mute line-through" : "text-ac-ink"}`}>{p.negozio}</div>
                        <div className="flex items-center gap-2">
                          {annullato && <Pillola tono="rosso" data-testid={`pagamento-annullato-${p.id}`}>Annullato</Pillola>}
                          <span className={`font-serif text-xl ${annullato ? "text-ac-mute line-through" : "text-ac-ink"}`}>{euro(p.importo)}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-ac-soft">
                        {metodoEtichetta(p.metodo)} · pagato il {data(p.data_pagamento)} · copre dal {data(p.periodo_coperto_dal)} al {data(p.periodo_coperto_al)}
                      </p>
                      {p.nota && <p className="mt-1 break-words text-sm text-ac-soft">Nota: {p.nota}</p>}
                      {!annullato && (
                        <button type="button" data-testid={`annulla-pagamento-${p.id}`} onClick={() => annulla(p)}
                          className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.rosa} mt-2`}>Annulla pagamento</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Scheda>
        </>
      )}

      {registra && d && (
        <RegistraDialog c={registra} oggi={d.oggi} suggerito={d.suggerito} hdrs={hdrs}
          onClose={() => setRegistra(null)} onFatto={() => { setRegistra(null); carica(); }} />
      )}
      {modifica && (
        <ModificaDialog c={modifica} hdrs={hdrs} onClose={() => setModifica(null)} onFatto={() => { setModifica(null); carica(); }} />
      )}
    </div>
  );
}

function Numero({ etichetta, valore, testid }) {
  return (
    <div className="rounded-xl bg-ac-tint px-3 py-3">
      <div data-testid={testid} className="font-serif text-3xl text-ac-ink">{valore}</div>
      <div className="text-xs font-bold text-ac-soft">{etichetta}</div>
    </div>
  );
}

function Stato({ stato, testid }) {
  const s = STATI[stato] || STATI.in_prova;
  return <Pillola tono={s.tono} data-testid={testid}>{s.testo}</Pillola>;
}

function Riga({ c, dettaglio, azione, testid }) {
  return (
    <li data-testid={testid} className="flex flex-col gap-2 rounded-2xl border border-ac-line p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="break-words text-base font-extrabold text-ac-ink">{c.negozio}</div>
        <div className="text-sm text-ac-soft">{dettaglio}</div>
      </div>
      {azione}
    </li>
  );
}

function RegistraDialog({ c, oggi, suggerito, hdrs, onClose, onFatto }) {
  const [f, setF] = useState({ importo: String(suggerito).replace(".", ","), metodo: "bonifico", data_pagamento: oggi, dal: "", al: "", nota: "" });
  const [invio, setInvio] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const salva = async (e) => {
    e.preventDefault();
    setInvio(true);
    try {
      await api.post(BASE, {
        merchant_id: c.merchant_id, importo: f.importo, metodo: f.metodo, data_pagamento: f.data_pagamento || null,
        periodo_coperto_dal: f.dal || null, periodo_coperto_al: f.al || null, nota: f.nota || null,
      }, hdrs ? hdrs() : undefined);
      toast.success("Pagamento registrato");
      onFatto();
    } catch (err) { toast.error(formatApiError(err)); setInvio(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="pag-dialog" className="max-h-[92vh] overflow-y-auto bg-white text-ac-ink">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-ac-ink">Registra pagamento</DialogTitle>
          <DialogDescription className="text-sm text-ac-soft">
            {c.negozio}. Annoti un pagamento già incassato: non addebita nulla e non scrive al commerciante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={salva} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ETICHETTA} htmlFor="pag-importo">Importo in euro</label>
              <Input id="pag-importo" data-testid="pag-importo" inputMode="decimal" value={f.importo} onChange={set("importo")} className={CAMPO} required />
            </div>
            <div>
              <label className={ETICHETTA} htmlFor="pag-metodo">Metodo</label>
              <select id="pag-metodo" data-testid="pag-metodo" value={f.metodo} onChange={set("metodo")} className={CAMPO}>
                {METODI.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={ETICHETTA} htmlFor="pag-data">Data del pagamento</label>
            <Input id="pag-data" data-testid="pag-data" type="date" value={f.data_pagamento} onChange={set("data_pagamento")} className={CAMPO} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ETICHETTA} htmlFor="pag-dal">Periodo dal</label>
              <Input id="pag-dal" data-testid="pag-dal" type="date" value={f.dal} onChange={set("dal")} className={CAMPO} />
            </div>
            <div>
              <label className={ETICHETTA} htmlFor="pag-al">al</label>
              <Input id="pag-al" data-testid="pag-al" type="date" value={f.al} onChange={set("al")} className={CAMPO} />
            </div>
          </div>
          <p className="text-xs text-ac-soft">Lascia vuoto il periodo: parte dalla fine di quello già pagato (o da oggi se è scaduto) e dura un mese.</p>
          <div>
            <label className={ETICHETTA} htmlFor="pag-nota">Nota (facoltativa, mai IBAN o dati di carte)</label>
            <Textarea id="pag-nota" data-testid="pag-nota" value={f.nota} onChange={set("nota")} maxLength={300} className={`${CAMPO} min-h-[88px] py-2`} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="submit" data-testid="pag-salva" disabled={invio} className={`${CLASSE_PRIMARIO} sm:flex-1`}>{invio ? "Salvo…" : "Registra"}</button>
            <button type="button" data-testid="pag-chiudi" onClick={onClose} className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola}`}>Chiudi senza registrare</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModificaDialog({ c, hdrs, onClose, onFatto }) {
  const [f, setF] = useState({ prova: c.prova_fino_al || "", rinnovo: c.prossimo_rinnovo || "", stato: c.stato_manuale === "sospeso" ? "sospeso" : "automatico", note: c.note || "" });
  const [invio, setInvio] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const salva = async (e) => {
    e.preventDefault();
    setInvio(true);
    try {
      await api.patch(`${BASE}/commercianti/${c.merchant_id}`, {
        prova_fino_al: f.prova || null, prossimo_rinnovo: f.rinnovo || null, stato: f.stato, note: f.note,
      }, hdrs ? hdrs() : undefined);
      toast.success("Modifiche salvate");
      onFatto();
    } catch (err) { toast.error(formatApiError(err)); setInvio(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="mod-dialog" className="max-h-[92vh] overflow-y-auto bg-white text-ac-ink">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-ac-ink">Modifica il piano</DialogTitle>
          <DialogDescription className="text-sm text-ac-soft">{c.negozio}. Cambia solo il registro: l'offerta del negozio resta com'è.</DialogDescription>
        </DialogHeader>
        <form onSubmit={salva} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ETICHETTA} htmlFor="mod-prova">Fine prova</label>
              <Input id="mod-prova" data-testid="mod-prova" type="date" value={f.prova} onChange={set("prova")} className={CAMPO} />
            </div>
            <div>
              <label className={ETICHETTA} htmlFor="mod-rinnovo">Prossimo rinnovo</label>
              <Input id="mod-rinnovo" data-testid="mod-rinnovo" type="date" value={f.rinnovo} onChange={set("rinnovo")} className={CAMPO} />
            </div>
          </div>
          <p className="text-xs text-ac-soft">Se svuoti la fine prova vale la data comune a tutti.</p>
          <div>
            <label className={ETICHETTA} htmlFor="mod-stato">Stato</label>
            <select id="mod-stato" data-testid="mod-stato" value={f.stato} onChange={set("stato")} className={CAMPO}>
              <option value="automatico">Automatico (in prova, attivo o scaduto secondo le date)</option>
              <option value="sospeso">Sospeso (messo a mano)</option>
            </select>
          </div>
          <div>
            <label className={ETICHETTA} htmlFor="mod-note">Note</label>
            <Textarea id="mod-note" data-testid="mod-note" value={f.note} onChange={set("note")} maxLength={500} className={`${CAMPO} min-h-[88px] py-2`} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="submit" data-testid="mod-salva" disabled={invio} className={`${CLASSE_PRIMARIO} sm:flex-1`}>{invio ? "Salvo…" : "Salva"}</button>
            <button type="button" data-testid="mod-chiudi" onClick={onClose} className={`${CLASSE_BASE_SECONDARIO} ${CLASSE_BORDO.viola}`}>Chiudi</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
