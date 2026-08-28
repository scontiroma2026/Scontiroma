import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, Lock, AlertTriangle, CalendarClock, CalendarPlus } from "lucide-react";
import PhotoGallery from "@/components/PhotoGallery";

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

export default function MerchantDiscount() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("tab") === "next" ? "next" : "current");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const [nextOffer, setNextOffer] = useState(null);
  const [win, setWin] = useState(null);

  useEffect(() => { load(mode); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const load = async (targetMode) => {
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
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    if (m === "next") setForm(nextOffer ? formFrom(nextOffer) : (existing ? formFrom(existing) : EMPTY_FORM));
    else setForm(existing ? formFrom(existing) : EMPTY_FORM);
  };

  const isNext = mode === "next";
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

  return (
    <main data-testid="merchant-discount-page" className="mx-auto max-w-3xl px-6 py-12 text-white">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Il tuo sconto</div>
        <h1 className="mt-2 font-serif text-5xl">
          {isNext ? `Offerta di ${monthLabel}` : (existing ? "La tua offerta" : "Crea la tua offerta")}
        </h1>
      </div>

      {/* Tab: offerta corrente vs mese prossimo */}
      <div className="mb-6 inline-flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          data-testid="offer-tab-current"
          onClick={() => switchMode("current")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            !isNext ? "grad-fucsia-viola text-white" : "text-white/60 hover:text-white"
          }`}
        >
          Offerta del mese
        </button>
        <button
          type="button"
          data-testid="offer-tab-next"
          onClick={() => switchMode("next")}
          className={`relative rounded-full px-5 py-2 text-sm font-semibold transition ${
            isNext ? "bg-ciano text-black" : "text-white/60 hover:text-white"
          }`}
        >
          <CalendarPlus size={14} className="inline mr-1.5 -mt-0.5" />
          Mese prossimo{win ? ` · ${monthLabel}` : ""}
          {nextOffer && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-fucsia" />}
        </button>
      </div>

      {/* ---- Banner offerta corrente ---- */}
      {!isNext && status === "pending" && (
        <Card data-testid="banner-pending" className="mb-6 border-neon/40 bg-neon/10 p-5">
          <div className="flex items-start gap-3">
            <Clock className="text-neon shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta in fase di revisione</div>
              <p className="text-sm text-white/70 mt-1">
                Sarà attiva a breve dopo l'approvazione dell'amministratore. Nel frattempo puoi modificarla liberamente.
              </p>
            </div>
          </div>
        </Card>
      )}
      {!isNext && status === "approved" && locked && (
        <Card data-testid="banner-locked" className="mb-6 border-fucsia/40 bg-fucsia/10 p-5">
          <div className="flex items-start gap-3">
            <Lock className="text-fucsia shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta attiva per questo mese</div>
              <p className="text-sm text-white/70 mt-1">
                Negli <strong className="text-ciano">ultimi 7 giorni del mese</strong> potrai caricare qui l'offerta per {monthLabel} dal tab "Mese prossimo". Se hai un errore grave, contatta l'amministratore per uno sblocco.
              </p>
            </div>
          </div>
        </Card>
      )}
      {!isNext && status === "expired" && (
        <Card data-testid="banner-expired" className="mb-6 border-gold/40 bg-gold/10 p-5">
          <div className="flex items-start gap-3">
            <CalendarClock className="text-gold shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta scaduta a fine mese</div>
              <p className="text-sm text-white/70 mt-1">
                Il tuo negozio è senza offerta attiva. Compila e invia una nuova offerta per tornare visibile nel catalogo.
              </p>
            </div>
          </div>
        </Card>
      )}
      {!isNext && status === "rejected" && (
        <Card data-testid="banner-rejected" className="mb-6 border-destructive/40 bg-destructive/10 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="text-destructive shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta rifiutata</div>
              <p className="text-sm text-white/70 mt-1">
                Modifica i dati e ri-invia per una nuova revisione.
                {existing?.approval_note && (
                  <span className="block mt-2 rounded-md bg-black/40 border border-white/10 p-2 text-white/80">
                    <strong className="text-destructive">Motivo:</strong> {existing.approval_note}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
      {!isNext && status === "approved" && !locked && existing?.force_editable && (
        <Card data-testid="banner-override" className="mb-6 border-ciano/40 bg-ciano/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-ciano shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Sblocco amministratore</div>
              <p className="text-sm text-white/70 mt-1">L'amministratore ti ha concesso una modifica straordinaria. Salvando, l'offerta tornerà in revisione.</p>
            </div>
          </div>
        </Card>
      )}

      {/* ---- Banner offerta mese prossimo ---- */}
      {isNext && windowClosed && (
        <Card data-testid="banner-next-closed" className="mb-6 border-gold/40 bg-gold/10 p-5">
          <div className="flex items-start gap-3">
            <CalendarClock className="text-gold shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Finestra di caricamento chiusa</div>
              <p className="text-sm text-white/70 mt-1">
                Potrai caricare l'offerta di <strong className="text-gold">{monthLabel}</strong> a partire dal <strong className="text-gold">{win?.opens_on}</strong>, negli ultimi 7 giorni del mese.
              </p>
            </div>
          </div>
        </Card>
      )}
      {isNext && !windowClosed && !nextOffer && (
        <Card data-testid="banner-next-new" className="mb-6 border-ciano/40 bg-ciano/10 p-5">
          <div className="flex items-start gap-3">
            <CalendarPlus className="text-ciano shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Prepara l'offerta di {monthLabel}</div>
              <p className="text-sm text-white/70 mt-1">
                Il modulo è precompilato con l'offerta attuale: modifica quello che vuoi. Dopo l'approvazione dell'amministratore, <strong className="text-ciano">il 1° del mese sostituirà automaticamente</strong> l'offerta corrente. Se non la carichi, il negozio resterà senza offerta.
              </p>
            </div>
          </div>
        </Card>
      )}
      {isNext && !windowClosed && nextOffer?.approval_status === "pending" && (
        <Card data-testid="banner-next-pending" className="mb-6 border-neon/40 bg-neon/10 p-5">
          <div className="flex items-start gap-3">
            <Clock className="text-neon shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta di {monthLabel} in revisione</div>
              <p className="text-sm text-white/70 mt-1">
                L'amministratore la sta esaminando. Una volta approvata, diventerà attiva automaticamente il 1° del mese. Puoi ancora modificarla.
              </p>
            </div>
          </div>
        </Card>
      )}
      {isNext && !windowClosed && nextOffer?.approval_status === "approved" && (
        <Card data-testid="banner-next-approved" className="mb-6 border-fucsia/40 bg-fucsia/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-fucsia shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta di {monthLabel} approvata ✓</div>
              <p className="text-sm text-white/70 mt-1">
                Il 1° del mese sostituirà automaticamente l'offerta corrente. Se la modifichi ora, tornerà in revisione.
              </p>
            </div>
          </div>
        </Card>
      )}
      {isNext && !windowClosed && nextOffer?.approval_status === "rejected" && (
        <Card data-testid="banner-next-rejected" className="mb-6 border-destructive/40 bg-destructive/10 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="text-destructive shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-serif text-xl text-white">Offerta di {monthLabel} rifiutata</div>
              <p className="text-sm text-white/70 mt-1">
                Modifica i dati e ri-invia per una nuova revisione.
                {nextOffer?.approval_note && (
                  <span className="block mt-2 rounded-md bg-black/40 border border-white/10 p-2 text-white/80">
                    <strong className="text-destructive">Motivo:</strong> {nextOffer.approval_note}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5 p-8">
        <fieldset disabled={readOnly} className={readOnly ? "opacity-60" : ""}>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Titolo offerta</Label>
              <Input data-testid="disc-title" required value={form.title} onChange={upd("title")} className="mt-1 bg-black/40 border-white/10 text-white" placeholder="Es. Menu degustazione a metà prezzo" />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea data-testid="disc-description" required value={form.description} onChange={upd("description")} className="mt-1 bg-black/40 border-white/10 text-white" rows={3} />
              <p className="mt-1 text-xs text-white/50">
                Suggerimento: racchiudi le parole chiave tra doppi asterischi per il <strong className="text-white">grassetto</strong> — es. <code className="text-ciano">**forno a legna**</code>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prezzo originale (€)</Label>
                <Input data-testid="disc-original" type="number" step="0.01" required value={form.original_price} onChange={upd("original_price")} className="mt-1 bg-black/40 border-white/10 text-white" />
              </div>
              <div>
                <Label>Prezzo scontato (€)</Label>
                <Input data-testid="disc-discounted" type="number" step="0.01" required value={form.discounted_price} onChange={upd("discounted_price")} className="mt-1 bg-black/40 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label>Foto dell'offerta <span className="text-xs text-white/50">(fino a 8, la 1ª è la copertina)</span></Label>
              <p className="text-xs text-white/50 mt-1 mb-3">
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
              <Label>Termini e condizioni (Fine print)</Label>
              <Textarea data-testid="disc-terms" value={form.terms} onChange={upd("terms")} className="mt-1 bg-black/40 border-white/10 text-white" rows={2} placeholder="Es. Utilizzabile entro il mese. Max 1 coupon a persona." />
            </div>

            {/* Sezioni informative stile Groupon (opzionali) */}
            <div className="rounded-lg border border-white/10 bg-black/40 p-4 space-y-4">
              <div className="text-xs uppercase tracking-wider text-gold">Informazioni per il cliente (opzionali)</div>
              <div>
                <Label>Pianifica in anticipo</Label>
                <Textarea data-testid="disc-plan-ahead" value={form.plan_ahead} onChange={upd("plan_ahead")} className="mt-1 bg-black/40 border-white/10 text-white" rows={2} placeholder="Es. Disdetta richiesta con 24 ore di preavviso. Appuntamento richiesto tramite telefono." />
                <p className="mt-1 text-xs text-white/50">Il tuo numero di telefono e WhatsApp verranno aggiunti automaticamente.</p>
              </div>
              <div>
                <Label>Inclusioni ed esclusioni</Label>
                <Textarea data-testid="disc-validity-info" value={form.validity_info} onChange={upd("validity_info")} className="mt-1 bg-black/40 border-white/10 text-white" rows={2} placeholder="Es. Giorni e orari di validità: da lunedì a sabato 11-18:30." />
              </div>
              <div>
                <Label>Informazioni aggiuntive</Label>
                <Textarea data-testid="disc-additional-info" value={form.additional_info} onChange={upd("additional_info")} className="mt-1 bg-black/40 border-white/10 text-white" rows={3} placeholder="Es. È necessaria la prenotazione. In caso di mancata disdetta o mancato appuntamento la seduta si considera persa." />
              </div>
            </div>

            {/* Utilizzi al mese per abbonato */}
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <Label className="text-white">Quante volte al mese ogni abbonato può usare questo sconto?</Label>
              <p className="text-xs text-white/60 mt-1 mb-3">
                Esempio: se scegli <strong>3</strong>, ogni cliente abbonato potrà scansionare il tuo QR fino a 3 volte nel mese in corso. Ogni utilizzo genera un codice QR <strong>diverso</strong> e conta una singola visita.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-testid={`disc-uses-${n}`}
                    onClick={() => setForm({ ...form, max_uses_per_month: n })}
                    disabled={readOnly}
                    className={`rounded-lg border py-3 text-sm font-semibold transition ${
                      form.max_uses_per_month === n
                        ? "border-fucsia bg-fucsia/15 text-fucsia"
                        : "border-white/10 bg-black/40 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {n === 1 ? "1 volta" : `${n}× mese`}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-white/50">
                Scelto: <span className="text-fucsia font-semibold">{form.max_uses_per_month} utilizzi al mese</span> per abbonato
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-4">
              <div>
                <div className="font-medium text-white">Offerta attiva</div>
                <div className="text-xs text-white/60">Se disattivata, non appare nel catalogo</div>
              </div>
              <Switch data-testid="disc-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <Button data-testid="disc-submit" type="submit" disabled={loading || readOnly} size="lg" className={`w-full text-white rounded-full py-6 ${isNext ? "bg-ciano text-black hover:bg-ciano/90" : "grad-fucsia-viola"}`}>
              {isNext
                ? (windowClosed ? <><Lock size={16} className="mr-2" /> Finestra chiusa — apre il {win?.opens_on}</>
                  : loading ? "Salvataggio…"
                  : nextOffer ? `Aggiorna offerta di ${monthLabel} (torna in revisione)` : `Invia offerta di ${monthLabel} (in revisione)`)
                : (readOnly ? <><Lock size={16} className="mr-2" /> Modifiche bloccate questo mese</>
                  : loading ? "Salvataggio…"
                  : existing ? "Aggiorna e ri-invia in revisione" : "Pubblica (in revisione)")}
            </Button>
          </form>
        </fieldset>
      </Card>

      {!isNext && status === "approved" && !locked && (
        <p className="mt-4 text-center text-xs text-white/50">
          <CheckCircle2 size={12} className="inline mr-1 text-fucsia" /> Offerta approvata e visibile agli utenti
        </p>
      )}
    </main>
  );
}
