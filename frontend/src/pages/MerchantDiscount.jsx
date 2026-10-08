import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, Lock, AlertTriangle, CalendarClock, CalendarPlus, Archive } from "lucide-react";
import PhotoGallery from "@/components/PhotoGallery";
import ArchivioOfferte from "@/components/ArchivioOfferte";
import { Scheda, TONI, ErroreRiprova, Scheletro } from "@/components/AreaUI";

const EMPTY_FORM = {
  title: "", description: "", original_price: "", discounted_price: "",
  image_url: "", image_urls: [], terms: "", active: true, max_uses_per_month: 1,
  plan_ahead: "", validity_info: "", additional_info: "",
};

const formFrom = (d) => ({
  title: d.title, description: d.description,
  original_price: d.original_price, discounted_price: d.discounted_price,
  image_url: d.image_url || "",
  image_urls: Array.isArray(d.image_urls) ? d.image_urls : (d.image_url ? [d.image_url] : []),
  terms: d.terms || "", active: d.active,
  max_uses_per_month: d.max_uses_per_month || 1,
  plan_ahead: d.plan_ahead || "",
  validity_info: d.validity_info || "",
  additional_info: d.additional_info || "",
});

// Stili dei campi (variante «Bianco vivo»): alti almeno 44 px, bordo ben visibile, testo scuro
const CAMPO = "mt-1.5 h-12 rounded-xl border-ac-campo bg-white text-base text-ac-ink";
const AREA = "mt-1.5 rounded-xl border-ac-campo bg-white text-base text-ac-ink";
const ETICHETTA = "text-sm font-bold text-ac-ink";
const AIUTO = "mt-1.5 text-xs leading-relaxed text-ac-mute";

/** Riquadro informativo colorato in cima al modulo (stato dell'offerta). */
const AVVISO = {
  ambra: "border-ac-ambra/40 bg-ac-ambraBg",
  rosa: "border-ac-rosa/40 bg-ac-rosaBg",
  rosso: "border-ac-rosso/40 bg-ac-rossoBg",
  teal: "border-ac-teal/40 bg-ac-tealBg",
  verde: "border-ac-verde/40 bg-ac-verdeBg",
};

function Avviso({ testid, tono, icona, titolo, children }) {
  const t = TONI[tono];
  return (
    <div data-testid={testid} className={`mb-4 rounded-2xl border ${AVVISO[tono]} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${t.testo}`} aria-hidden="true">{icona}</span>
        <div className="min-w-0">
          <div className="font-serif text-xl font-bold leading-tight text-ac-ink">{titolo}</div>
          <p className="mt-1 text-sm leading-relaxed text-ac-soft">{children}</p>
        </div>
      </div>
    </div>
  );
}

export default function MerchantDiscount() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabIniziale = searchParams.get("tab");
  const [mode, setMode] = useState(tabIniziale === "next" || tabIniziale === "archivio" ? tabIniziale : "current");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const [nextOffer, setNextOffer] = useState(null);
  const [win, setWin] = useState(null);
  // Il modulo si sblocca solo quando sono arrivati i dati dal server: altrimenti la risposta
  // (anche lenta, server appena svegliato) cancellerebbe quello che il commerciante ha già scritto.
  const [loaded, setLoaded] = useState(false);
  const [erroreCarica, setErroreCarica] = useState(false);

  useEffect(() => { load(mode); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const load = async (targetMode) => {
    setErroreCarica(false);
    try {
      const [cur, nxt] = await Promise.all([
        api.get("/merchants/me/discount"),
        api.get("/merchants/me/next-discount"),
      ]);
      const c = cur.data.discount;
      const n = nxt.data.next_discount;
      setExisting(c);
      setNextOffer(n);
      setWin(nxt.data.window);
      if (targetMode === "next") setForm(n ? formFrom(n) : (c ? formFrom(c) : EMPTY_FORM));
      else setForm(c ? formFrom(c) : EMPTY_FORM);
    } catch (e) {
      setErroreCarica(true);
      toast.error(formatApiError(e) || "Impossibile caricare l'offerta, riprova.");
    } finally {
      setLoaded(true);
    }
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    if (m === "next") setForm(nextOffer ? formFrom(nextOffer) : (existing ? formFrom(existing) : EMPTY_FORM));
    else setForm(existing ? formFrom(existing) : EMPTY_FORM);
  };

  const isNext = mode === "next";

  // «Riusa» dall'archivio: copia l'offerta passata nel modulo del mese prossimo (da controllare e inviare)
  const riusa = async (archivioId) => {
    try {
      const { data } = await api.get(`/merchants/me/archive/${archivioId}`);
      setMode("next");
      setForm(formFrom({ ...data.offerta, active: true }));
      toast.success("Offerta copiata: controllala e inviala per il mese prossimo.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const monthLabel = win?.next_month_label || "il mese prossimo";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        original_price: parseFloat(form.original_price),
        discounted_price: parseFloat(form.discounted_price),
        max_uses_per_month: parseInt(form.max_uses_per_month, 10) || 1,
      };
      if (isNaN(payload.original_price) || isNaN(payload.discounted_price)) {
        toast.error("Inserisci prezzi validi"); setLoading(false); return;
      }
      if (payload.discounted_price >= payload.original_price) {
        toast.error("Il prezzo scontato deve essere inferiore all'originale"); setLoading(false); return;
      }
      if (isNext) {
        await api.post("/merchants/me/next-discount", payload);
        toast.success(`Offerta di ${monthLabel} inviata! Attende approvazione dell'amministratore.`);
      } else {
        await api.post("/merchants/me/discount", payload);
        toast.success("Offerta inviata! Attende approvazione dell'amministratore.");
      }
      load(mode);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setLoading(false); }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const status = isNext ? nextOffer?.approval_status : existing?.approval_status;
  const locked = !isNext && existing?.locked_this_month;
  const windowClosed = isNext && win && !win.open;
  const readOnly = isNext ? windowClosed : locked;

  // Tab: stessa forma per tutte, colore pieno quando è quella scelta
  const tab = (attiva, coloreAttivo) =>
    `relative inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-extrabold transition ${
      attiva ? `${coloreAttivo} border-transparent text-white` : "border-ac-line bg-white text-ac-ink hover:border-ac-campo"
    }`;

  return (
    <main data-testid="merchant-discount-page" className="text-ac-ink">
      <section className="bg-ac-rosaSoft">
        <div className="mx-auto max-w-3xl px-4 pb-5 pt-6 sm:px-6">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ac-viola">Il tuo sconto</div>
          <h1 className="mt-1.5 text-[30px] leading-[1.1] sm:text-4xl">
            {isNext ? `Offerta di ${monthLabel}` : (existing ? "La tua offerta" : "Crea la tua offerta")}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 sm:px-6">
        {/* Tab: offerta corrente vs mese prossimo */}
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Quale offerta">
          <button
            type="button"
            data-testid="offer-tab-current"
            aria-pressed={!isNext && mode !== "archivio"}
            onClick={() => switchMode("current")}
            className={tab(!isNext && mode !== "archivio", "ac-grad")}
          >
            Offerta del mese
          </button>
          <button
            type="button"
            data-testid="offer-tab-next"
            aria-pressed={isNext}
            onClick={() => switchMode("next")}
            className={tab(isNext, "bg-ac-teal")}
          >
            <CalendarPlus size={16} className="mr-1.5" aria-hidden="true" />
            Mese prossimo{win ? <span className="hidden sm:inline">{` · ${monthLabel}`}</span> : null}
            {nextOffer && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-ac-rosa" aria-label="Offerta già caricata" />}
          </button>
          <button
            type="button"
            data-testid="offer-tab-archivio"
            aria-pressed={mode === "archivio"}
            onClick={() => setMode("archivio")}
            className={tab(mode === "archivio", "bg-ac-ink")}
          >
            <Archive size={16} className="mr-1.5" aria-hidden="true" />
            Archivio
          </button>
        </div>

        {mode === "archivio" ? (
          <ArchivioOfferte onRiusa={riusa} finestraAperta={Boolean(win?.open)} monthLabel={monthLabel} />
        ) : (<>

        {erroreCarica && (
          <div className="mb-4">
            <ErroreRiprova onRiprova={() => { setLoaded(false); load(mode); }}>Non riusciamo a caricare la tua offerta. Controlla la connessione e riprova.</ErroreRiprova>
          </div>
        )}
        {!loaded && (
          <div role="status" aria-label="Caricamento dell'offerta" className="mb-4 space-y-3">
            <Scheletro className="h-5 w-1/2" />
            <Scheletro className="h-5 w-3/4" />
          </div>
        )}

        {/* ---- Banner offerta corrente ---- */}
        {!isNext && status === "pending" && (
          <Avviso testid="banner-pending" tono="ambra" icona={<Clock size={20} />} titolo="Offerta in fase di revisione">
            Sarà attiva a breve dopo l'approvazione dell'amministratore. Nel frattempo puoi modificarla liberamente.
          </Avviso>
        )}
        {!isNext && status === "approved" && locked && (
          <Avviso testid="banner-locked" tono="rosa" icona={<Lock size={20} />} titolo="Offerta attiva per questo mese">
            Negli <strong className="text-ac-ink">ultimi 7 giorni del mese</strong> potrai caricare qui l'offerta per {monthLabel} dal tab "Mese prossimo". Se hai un errore grave, contatta l'amministratore per uno sblocco.
          </Avviso>
        )}
        {!isNext && status === "expired" && (
          <Avviso testid="banner-expired" tono="ambra" icona={<CalendarClock size={20} />} titolo="Offerta scaduta a fine mese">
            Il tuo negozio è senza offerta attiva. Compila e invia una nuova offerta per tornare visibile nel catalogo.
          </Avviso>
        )}
        {!isNext && status === "rejected" && (
          <Avviso testid="banner-rejected" tono="rosso" icona={<XCircle size={20} />} titolo="Offerta rifiutata">
            Modifica i dati e ri-invia per una nuova revisione.
            {existing?.approval_note && (
              <span className="mt-2 block rounded-xl border border-ac-rosso/30 bg-white p-3 text-ac-ink">
                <strong className="text-ac-rosso">Motivo:</strong> {existing.approval_note}
              </span>
            )}
          </Avviso>
        )}
        {!isNext && status === "approved" && !locked && existing?.force_editable && (
          <Avviso testid="banner-override" tono="teal" icona={<AlertTriangle size={20} />} titolo="Sblocco amministratore">
            L'amministratore ti ha concesso una modifica straordinaria. Salvando, l'offerta tornerà in revisione.
          </Avviso>
        )}

        {/* ---- Banner offerta mese prossimo ---- */}
        {isNext && windowClosed && (
          <Avviso testid="banner-next-closed" tono="ambra" icona={<CalendarClock size={20} />} titolo="Finestra di caricamento chiusa">
            Potrai caricare l'offerta di <strong className="text-ac-ink">{monthLabel}</strong> a partire dal <strong className="text-ac-ink">{win?.opens_on}</strong>, negli ultimi 7 giorni del mese.
          </Avviso>
        )}
        {isNext && !windowClosed && !nextOffer && (
          <Avviso testid="banner-next-new" tono="teal" icona={<CalendarPlus size={20} />} titolo={`Prepara l'offerta di ${monthLabel}`}>
            Il modulo è precompilato con l'offerta attuale: modifica quello che vuoi. Dopo l'approvazione dell'amministratore, <strong className="text-ac-ink">il 1° del mese sostituirà automaticamente</strong> l'offerta corrente. Se non la carichi, il negozio resterà senza offerta.
          </Avviso>
        )}
        {isNext && !windowClosed && nextOffer?.approval_status === "pending" && (
          <Avviso testid="banner-next-pending" tono="ambra" icona={<Clock size={20} />} titolo={`Offerta di ${monthLabel} in revisione`}>
            L'amministratore la sta esaminando. Una volta approvata, diventerà attiva automaticamente il 1° del mese. Puoi ancora modificarla.
          </Avviso>
        )}
        {isNext && !windowClosed && nextOffer?.approval_status === "approved" && (
          <Avviso testid="banner-next-approved" tono="verde" icona={<CheckCircle2 size={20} />} titolo={`Offerta di ${monthLabel} approvata ✓`}>
            Il 1° del mese sostituirà automaticamente l'offerta corrente. Se la modifichi ora, tornerà in revisione.
          </Avviso>
        )}
        {isNext && !windowClosed && nextOffer?.approval_status === "rejected" && (
          <Avviso testid="banner-next-rejected" tono="rosso" icona={<XCircle size={20} />} titolo={`Offerta di ${monthLabel} rifiutata`}>
            Modifica i dati e ri-invia per una nuova revisione.
            {nextOffer?.approval_note && (
              <span className="mt-2 block rounded-xl border border-ac-rosso/30 bg-white p-3 text-ac-ink">
                <strong className="text-ac-rosso">Motivo:</strong> {nextOffer.approval_note}
              </span>
            )}
          </Avviso>
        )}

        <Scheda className="!p-4 sm:!p-6">
          <fieldset data-testid="disc-form" data-loaded={loaded ? "1" : "0"} disabled={readOnly || !loaded} className={readOnly || !loaded ? "opacity-60" : ""}>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label htmlFor="disc-title" className={ETICHETTA}>Titolo offerta</Label>
                <Input id="disc-title" data-testid="disc-title" required value={form.title} onChange={upd("title")} className={CAMPO} placeholder="Es. Menu degustazione a metà prezzo" />
              </div>
              <div>
                <Label htmlFor="disc-description" className={ETICHETTA}>Descrizione</Label>
                <Textarea id="disc-description" data-testid="disc-description" required value={form.description} onChange={upd("description")} className={AREA} rows={3} />
                <p className={AIUTO}>
                  Suggerimento: racchiudi le parole chiave tra doppi asterischi per il <strong className="text-ac-ink">grassetto</strong> — es. <code className="rounded bg-ac-tint px-1 font-bold text-ac-viola">**forno a legna**</code>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="disc-original" className={ETICHETTA}>Prezzo originale (€)</Label>
                  <Input id="disc-original" data-testid="disc-original" type="number" inputMode="decimal" step="0.01" required value={form.original_price} onChange={upd("original_price")} className={CAMPO} />
                </div>
                <div>
                  <Label htmlFor="disc-discounted" className={ETICHETTA}>Prezzo scontato (€)</Label>
                  <Input id="disc-discounted" data-testid="disc-discounted" type="number" inputMode="decimal" step="0.01" required value={form.discounted_price} onChange={upd("discounted_price")} className={CAMPO} />
                </div>
              </div>
              <div>
                <div className={ETICHETTA}>Foto dell'offerta <span className="text-xs font-semibold text-ac-mute">(fino a 8, la 1ª è la copertina)</span></div>
                <p className={`${AIUTO} mb-3`}>
                  Carica le tue foto (verranno ottimizzate) oppure scegli dalla libreria di 100 immagini pronte. Trascina l'ordine o rimuovi con la X.
                </p>
                <PhotoGallery
                  value={form.image_urls}
                  onChange={(urls) => setForm((f) => ({
                    ...f,
                    image_urls: urls,
                    image_url: urls[0] || "", // copertina
                  }))}
                  max={8}
                  disabled={readOnly}
                  category={user?.category || ""}
                />
              </div>
              <div>
                <Label htmlFor="disc-terms" className={ETICHETTA}>Termini e condizioni (Fine print)</Label>
                <Textarea id="disc-terms" data-testid="disc-terms" value={form.terms} onChange={upd("terms")} className={AREA} rows={2} placeholder="Es. Utilizzabile entro il mese. Max 1 coupon a persona." />
              </div>

              {/* Sezioni informative stile Groupon (opzionali) */}
              <div className="space-y-4 rounded-2xl bg-ac-tint p-4">
                <div className="flex items-center gap-2 text-[13px] font-extrabold text-ac-viola">
                  <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full bg-ac-viola" />
                  Informazioni per il cliente (opzionali)
                </div>
                <div>
                  <Label htmlFor="disc-plan-ahead" className={ETICHETTA}>Pianifica in anticipo</Label>
                  <Textarea id="disc-plan-ahead" data-testid="disc-plan-ahead" value={form.plan_ahead} onChange={upd("plan_ahead")} className={AREA} rows={2} placeholder="Es. Disdetta richiesta con 24 ore di preavviso. Appuntamento richiesto tramite telefono." />
                  <p className={AIUTO}>Il tuo numero di telefono e WhatsApp verranno aggiunti automaticamente.</p>
                </div>
                <div>
                  <Label htmlFor="disc-validity-info" className={ETICHETTA}>Inclusioni ed esclusioni</Label>
                  <Textarea id="disc-validity-info" data-testid="disc-validity-info" value={form.validity_info} onChange={upd("validity_info")} className={AREA} rows={2} placeholder="Es. Giorni e orari di validità: da lunedì a sabato 11-18:30." />
                </div>
                <div>
                  <Label htmlFor="disc-additional-info" className={ETICHETTA}>Informazioni aggiuntive</Label>
                  <Textarea id="disc-additional-info" data-testid="disc-additional-info" value={form.additional_info} onChange={upd("additional_info")} className={AREA} rows={3} placeholder="Es. È necessaria la prenotazione. In caso di mancata disdetta o mancato appuntamento la seduta si considera persa." />
                </div>
              </div>

              {/* Utilizzi al mese per cliente */}
              <div className="rounded-2xl bg-ac-tint p-4">
                <div className={ETICHETTA}>Quante volte al mese ogni cliente può usare questo sconto?</div>
                <p className={`${AIUTO} mb-3`}>
                  Esempio: se scegli <strong className="text-ac-ink">3</strong>, ogni cliente potrà far scansionare il tuo QR fino a 3 volte nel mese in corso. Ogni utilizzo genera un codice QR <strong className="text-ac-ink">diverso</strong> e conta una singola visita.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {[1, 2, 3, 5, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      data-testid={`disc-uses-${n}`}
                      aria-pressed={form.max_uses_per_month === n}
                      onClick={() => setForm({ ...form, max_uses_per_month: n })}
                      disabled={readOnly}
                      className={`min-h-12 rounded-xl border-2 px-1 text-sm font-extrabold transition ${
                        form.max_uses_per_month === n
                          ? "border-ac-rosa bg-ac-rosa text-white"
                          : "border-ac-campo bg-white text-ac-ink hover:border-ac-rosa"
                      }`}
                    >
                      {n === 1 ? "1 volta" : `${n}× mese`}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-sm text-ac-soft">
                  Scelto: <span className="font-extrabold text-ac-rosa">{form.max_uses_per_month} utilizzi al mese</span> per cliente
                </div>
              </div>
              <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-ac-tint p-4">
                <div>
                  <Label htmlFor="disc-active" className="text-sm font-bold text-ac-ink">Offerta attiva</Label>
                  <div className="text-xs text-ac-soft">Se disattivata, non appare nel catalogo</div>
                </div>
                <Switch
                  id="disc-active"
                  data-testid="disc-active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                  className="h-8 w-14 shrink-0 data-[state=checked]:bg-ac-verde [&>span]:h-6 [&>span]:w-6 data-[state=checked]:[&>span]:translate-x-6"
                />
              </div>
              <button
                data-testid="disc-submit"
                type="submit"
                disabled={loading || readOnly}
                className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-center text-base font-extrabold leading-snug text-white transition hover:brightness-105 disabled:opacity-60 ${
                  isNext ? "bg-ac-teal" : "ac-grad ac-ombra-rosa"
                }`}
              >
                {isNext
                  ? (windowClosed ? <><Lock size={16} aria-hidden="true" /> Finestra chiusa — apre il {win?.opens_on}</>
                    : loading ? "Salvataggio…"
                    : nextOffer ? `Aggiorna offerta di ${monthLabel} (torna in revisione)` : `Invia offerta di ${monthLabel} (in revisione)`)
                  : (readOnly ? <><Lock size={16} aria-hidden="true" /> Modifiche bloccate questo mese</>
                    : loading ? "Salvataggio…"
                    : existing ? "Aggiorna e ri-invia in revisione" : "Pubblica (in revisione)")}
              </button>
            </form>
          </fieldset>
        </Scheda>

        {!isNext && status === "approved" && !locked && (
          <p className="mt-4 text-center text-sm font-semibold text-ac-verde">
            <CheckCircle2 size={16} className="mr-1 inline" aria-hidden="true" /> Offerta approvata e visibile agli utenti
          </p>
        )}
        </>)}
      </div>
    </main>
  );
}
