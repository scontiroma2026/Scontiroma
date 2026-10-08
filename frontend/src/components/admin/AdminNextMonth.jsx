import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Check, X, Mail, CalendarClock, RefreshCw, Send, ChevronDown, ChevronRight,
  Phone, MapPin, Edit3, Store,
} from "lucide-react";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { renderBold } from "@/lib/renderBold";

const STATUS_BADGE = {
  approved: ["Approvata ✓", "bg-fucsia/15 border-fucsia/40 text-fucsia"],
  pending: ["In revisione", "bg-neon/15 border-neon/40 text-neon"],
  rejected: ["Rifiutata", "bg-destructive/15 border-destructive/40 text-destructive"],
  missing: ["Non caricata", "bg-muted border-border text-muted-foreground"],
};

/** Tab admin "Prossimo Mese": stato caricamento offerte di tutti i negozi + revisione completa. */
export default function AdminNextMonth({ hdrs }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState({});
  const [editRow, setEditRow] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/admin/next-offers", hdrs());
      setData(r.data);
    } catch (err) { toast.error(formatApiError(err)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try {
      await api.post(`/admin/next-offers/${id}/approve`, {}, hdrs());
      toast.success("Offerta mese prossimo approvata ✓ — attiva dal 1°");
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const reject = async (id) => {
    const reason = window.prompt("Motivo del rifiuto (visibile al commerciante):", "") || "";
    try {
      await api.post(`/admin/next-offers/${id}/reject`, { reason }, hdrs());
      toast.success("Offerta rimandata in bozza al commerciante");
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const runReminders = async () => {
    setBusy(true);
    try {
      const r = await api.post("/admin/next-offers/run-reminders", {}, hdrs());
      const d = r.data;
      toast.success(d.window_open ? `Promemoria inviati: ${d.sent} (controllati ${d.checked})` : "Finestra chiusa: nessun promemoria inviato");
      load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  const runRollover = async () => {
    if (!window.confirm("Eseguire ORA il passaggio mese?\n\n• Le offerte approvate del mese prossimo sostituiranno quelle correnti\n• Le offerte correnti senza sostituzione SCADRANNO\n\nQuesta azione normalmente avviene in automatico il 1° del mese alle 00:05.")) return;
    setBusy(true);
    try {
      const r = await api.post("/admin/next-offers/run-rollover", {}, hdrs());
      const d = r.data;
      toast.success(`Rollover eseguito: ${d.promoted} promosse, ${d.migrated_pending} in revisione, ${d.expired} scadute`);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  const toggleWindow = async () => {
    const win = data?.window;
    const payload = win?.overridden ? { open: null } : { open: !win?.open };
    try {
      await api.post("/admin/next-offers/window-override", payload, hdrs());
      toast.success(win?.overridden ? "Finestra tornata alla regola automatica (ultimi 7 giorni)" : `Finestra forzata ${!win?.open ? "APERTA" : "CHIUSA"}`);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  if (!data) return <div className="py-10 text-muted-foreground">Caricamento…</div>;
  const { window: win, rows, summary } = data;

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((r) =>
        [r.shop_name, r.zone, r.category, r.email, r.next_offer?.title, r.current_offer?.title]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
    : rows;

  return (
    <Card className="border-border bg-muted p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl">Offerte di {win.next_month_label}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Tutti i negozi dell'app: chi ha caricato l'offerta del mese prossimo e chi deve ancora farlo.
            Apri "Rivedi offerta" per vedere tutti i dettagli e i dati del commerciante prima di approvare.
          </p>
          <div data-testid="next-window-status" className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs">
            <CalendarClock size={13} className={win.open ? "text-neon" : "text-gold"} />
            Finestra caricamento: {win.open ? <strong className="text-neon">APERTA</strong> : <strong className="text-gold">CHIUSA (apre il {win.opens_on})</strong>}
            {win.overridden && <span className="text-ciano">· override manuale</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="next-run-reminders-btn" size="sm" variant="outline" disabled={busy} onClick={runReminders} className="rounded-full border-border text-foreground hover:bg-muted">
            <Mail size={13} className="mr-1.5" /> Invia promemoria ora
          </Button>
          <Button data-testid="next-window-override-btn" size="sm" variant="outline" disabled={busy} onClick={toggleWindow} className="rounded-full border-ciano/40 text-ciano hover:bg-ciano/10">
            <RefreshCw size={13} className="mr-1.5" /> {win.overridden ? "Ripristina automatico" : win.open ? "Forza chiusura" : "Apri finestra ora"}
          </Button>
          <Button data-testid="next-run-rollover-btn" size="sm" variant="outline" disabled={busy} onClick={runRollover} className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10">
            <Send size={13} className="mr-1.5" /> Esegui passaggio mese
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span data-testid="next-summary-total" className="rounded-full border border-border bg-muted px-3 py-1">Negozi: <strong>{summary.total}</strong></span>
        <span className="rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-neon">In revisione: <strong>{summary.pending}</strong></span>
        <span className="rounded-full border border-fucsia/40 bg-fucsia/10 px-3 py-1 text-fucsia">Approvate: <strong>{summary.approved}</strong></span>
        <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-destructive">Rifiutate: <strong>{summary.rejected}</strong></span>
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-muted-foreground">Non caricate: <strong>{summary.missing}</strong></span>
        <div className="ml-auto">
          <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca negozio, zona, offerta…" testId="next-search" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-muted p-8 text-center text-muted-foreground">Nessun negozio trovato per "{q}".</div>
        )}
        {filtered.map((r) => {
          const [label, cls] = STATUS_BADGE[r.next_status] || STATUS_BADGE.missing;
          const nd = r.next_offer;
          const isOpen = !!expanded[r.merchant_id];
          return (
            <div key={r.merchant_id} data-testid={`nextoffer-row-${r.merchant_id}`} className="rounded-xl border border-border bg-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-lg text-foreground">{r.shop_name}</span>
                    <span className="text-xs text-muted-foreground">{r.zone} · {r.category}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                    {r.reminder_sent && <span className="text-xs text-ciano" title="Email promemoria inviata">📧 promemoria inviato</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Offerta corrente: {r.current_offer
                      ? <span className="text-foreground/80">{r.current_offer.title} {r.current_offer.approval_status === "expired" ? "(scaduta)" : r.current_offer.active ? "" : "(disattivata)"}</span>
                      : <span className="text-muted-foreground">nessuna</span>}
                    {nd && <span className="ml-3 text-muted-foreground">→ Nuova: <span className="text-ciano">{nd.title}</span></span>}
                  </div>
                </div>
                {nd && (
                  <Button
                    data-testid={`nextoffer-toggle-${r.merchant_id}`}
                    size="sm"
                    variant="outline"
                    onClick={() => setExpanded((e) => ({ ...e, [r.merchant_id]: !e[r.merchant_id] }))}
                    className="rounded-full border-ciano/40 text-ciano hover:bg-ciano/10 shrink-0"
                  >
                    {isOpen ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                    {isOpen ? "Chiudi dettaglio" : "Rivedi offerta completa"}
                  </Button>
                )}
              </div>

              {nd && isOpen && (
                <NextOfferDetail
                  row={r}
                  nd={nd}
                  monthLabel={win.next_month_label}
                  onApprove={() => approve(nd.id)}
                  onReject={() => reject(nd.id)}
                  onEdit={() => setEditRow(r)}
                />
              )}
            </div>
          );
        })}
      </div>

      {editRow && (
        <NextOfferEditModal
          row={editRow}
          hdrs={hdrs}
          onClose={() => setEditRow(null)}
          onSaved={() => { setEditRow(null); load(); }}
        />
      )}
    </Card>
  );
}

/** Dettaglio completo: dati commerciante PRIMA, poi tutta l'offerta, poi i pulsanti di revisione. */
function NextOfferDetail({ row, nd, monthLabel, onApprove, onReject, onEdit }) {
  const m = row.merchant || {};
  const images = Array.isArray(nd.image_urls) && nd.image_urls.length ? nd.image_urls : (nd.image_url ? [nd.image_url] : []);
  const InfoBlock = ({ title, text }) => text ? (
    <div>
      <div className="text-xs uppercase tracking-wider text-gold">{title}</div>
      <p className="mt-1 text-sm text-foreground/80 whitespace-pre-line">{renderBold(text)}</p>
    </div>
  ) : null;

  return (
    <div data-testid={`nextoffer-detail-${row.merchant_id}`} className="mt-4 space-y-4 rounded-xl border border-ciano/20 bg-muted p-5">
      {/* 1 — Dati del commerciante */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ciano">
          <Store size={13} /> Dati del commerciante
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Referente</div><div className="text-foreground">{m.name || "—"}</div></div>
          <div><div className="text-xs text-muted-foreground">Email</div><a href={`mailto:${m.email}`} className="text-fucsia hover:underline break-all">{m.email || "—"}</a></div>
          <div>
            <div className="text-xs text-muted-foreground">Telefono</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-foreground font-mono">{m.phone || <span className="text-muted-foreground">non fornito</span>}</span>
              {m.phone && (
                <a
                  href={`https://wa.me/${(m.phone || "").replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(`Ciao ${m.name || "commerciante"}, ti scrivo da Sconti Roma per la tua offerta di ${monthLabel}...`)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-700 hover:bg-emerald-800 px-2 py-0.5 text-[10px] font-medium text-white"
                ><Phone size={9} /> WhatsApp</a>
              )}
            </div>
          </div>
          <div className="sm:col-span-2"><div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} /> Indirizzo</div><div className="text-foreground">{m.address || <span className="text-muted-foreground">non impostato</span>}</div></div>
          <div><div className="text-xs text-muted-foreground">P.IVA</div><div className="text-foreground font-mono">{m.piva || <span className="text-muted-foreground">non fornita</span>}</div></div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* 2 — Offerta completa */}
      <div>
        <div className="text-xs uppercase tracking-wider text-ciano">Offerta completa di {monthLabel}</div>
        {images.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((url, i) => (
              <img key={`${url.slice(0, 40)}-${i}`} src={url} alt="" className="h-24 w-36 shrink-0 rounded-lg object-cover border border-border" />
            ))}
          </div>
        )}
        <div className="mt-3 font-serif text-2xl text-foreground">{nd.title}</div>
        <p className="mt-1 text-sm text-foreground/80 whitespace-pre-line">{renderBold(nd.description)}</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-fucsia font-bold text-xl">€{nd.discounted_price?.toFixed(2)}</span>
          <span className="text-muted-foreground line-through">€{nd.original_price?.toFixed(2)}</span>
          <span className="text-neon text-sm">−{nd.percent_off}%</span>
          <span className="ml-3 rounded-full border border-fucsia/40 bg-fucsia/10 px-2.5 py-0.5 text-xs text-fucsia font-semibold">🔁 {nd.max_uses_per_month || 1}× al mese per cliente</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${nd.active ? "bg-ciano/15 text-ciano border border-ciano/40" : "bg-muted text-muted-foreground border border-border"}`}>
            {nd.active ? "● attiva nel catalogo" : "○ non attiva"}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <InfoBlock title="Termini e condizioni (Fine print)" text={nd.terms} />
          <InfoBlock title="Pianifica in anticipo" text={nd.plan_ahead} />
          <InfoBlock title="Inclusioni ed esclusioni" text={nd.validity_info} />
          <InfoBlock title="Informazioni aggiuntive" text={nd.additional_info} />
        </div>
        {nd.approval_note && <div className="mt-3 text-xs text-destructive">Motivo ultimo rifiuto: {nd.approval_note}</div>}
      </div>

      <div className="border-t border-border" />

      {/* 3 — Azioni di revisione (dopo aver letto tutto) */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button data-testid={`nextoffer-edit-${nd.id}`} size="sm" variant="outline" onClick={onEdit} className="rounded-full border-ciano/40 text-ciano hover:bg-ciano/10">
          <Edit3 size={13} className="mr-1" /> Modifica manualmente
        </Button>
        {nd.approval_status !== "rejected" && (
          <Button data-testid={`nextoffer-reject-${nd.id}`} size="sm" variant="outline" onClick={onReject} className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10">
            <X size={13} className="mr-1" /> Rifiuta
          </Button>
        )}
        {nd.approval_status !== "approved" && (
          <Button data-testid={`nextoffer-approve-${nd.id}`} size="sm" onClick={onApprove} className="grad-fucsia-viola text-white rounded-full">
            <Check size={13} className="mr-1" /> Approva
          </Button>
        )}
      </div>
    </div>
  );
}

/** Modale modifica manuale completa. Salvando, l'offerta torna SEMPRE in revisione. */
function NextOfferEditModal({ row, hdrs, onClose, onSaved }) {
  const nd = row.next_offer;
  const [f, setF] = useState({
    title: nd.title || "",
    description: nd.description || "",
    original_price: nd.original_price ?? "",
    discounted_price: nd.discounted_price ?? "",
    terms: nd.terms || "",
    plan_ahead: nd.plan_ahead || "",
    validity_info: nd.validity_info || "",
    additional_info: nd.additional_info || "",
    image_url: nd.image_url || "",
    max_uses_per_month: nd.max_uses_per_month || 1,
    active: nd.active !== false,
  });
  const [busy, setBusy] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ...f,
        original_price: parseFloat(f.original_price),
        discounted_price: parseFloat(f.discounted_price),
        max_uses_per_month: parseInt(f.max_uses_per_month, 10) || 1,
      };
      if (isNaN(payload.original_price) || isNaN(payload.discounted_price) || payload.discounted_price >= payload.original_price) {
        toast.error("Verifica i prezzi (scontato < originale)");
        setBusy(false);
        return;
      }
      await api.put(`/admin/next-offers/${nd.id}`, payload, hdrs());
      toast.success("Offerta aggiornata — tornata in revisione, va ri-approvata");
      onSaved();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase text-ciano tracking-wider">Modifica offerta mese prossimo</div>
            <h3 className="font-serif text-2xl text-foreground">{row.shop_name}</h3>
            <p className="text-xs text-neon mt-1">⚠ Salvando, l'offerta torna in revisione e va ri-approvata.</p>
          </div>
          <button onClick={onClose} className="rounded-md bg-muted p-2 text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-xs">Titolo</Label>
            <Input data-testid="admin-next-title" value={f.title} onChange={upd("title")} className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Descrizione</Label>
            <Textarea data-testid="admin-next-description" value={f.description} onChange={upd("description")} rows={3} className="bg-muted border-border text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Prezzo originale (€)</Label>
              <Input data-testid="admin-next-original" type="number" step="0.01" value={f.original_price} onChange={upd("original_price")} className="bg-muted border-border text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Prezzo scontato (€)</Label>
              <Input data-testid="admin-next-discounted" type="number" step="0.01" value={f.discounted_price} onChange={upd("discounted_price")} className="bg-muted border-border text-foreground" />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Termini e condizioni</Label>
            <Textarea value={f.terms} onChange={upd("terms")} rows={2} className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Pianifica in anticipo</Label>
            <Textarea value={f.plan_ahead} onChange={upd("plan_ahead")} rows={2} className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Inclusioni ed esclusioni</Label>
            <Textarea value={f.validity_info} onChange={upd("validity_info")} rows={2} className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Informazioni aggiuntive</Label>
            <Textarea value={f.additional_info} onChange={upd("additional_info")} rows={2} className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Immagine copertina (URL)</Label>
            <Input value={f.image_url} onChange={upd("image_url")} placeholder="https://… o dataURL" className="bg-muted border-border text-foreground text-xs" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Utilizzi al mese per cliente</Label>
            <div className="mt-1 grid grid-cols-5 gap-2">
              {[1, 2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setF({ ...f, max_uses_per_month: n })}
                  className={`rounded-lg border py-2 text-xs font-semibold transition ${
                    f.max_uses_per_month === n ? "border-fucsia bg-fucsia/10 text-fucsia" : "border-border bg-muted text-muted-foreground hover:border-input"
                  }`}
                >{n}×</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
            <span className="text-sm text-foreground">Offerta attiva</span>
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-5 w-5 accent-fucsia" />
          </div>
          <Button data-testid="admin-next-save" onClick={save} disabled={busy} className="w-full grad-fucsia-viola text-white rounded-full">
            {busy ? "Salvataggio…" : "Salva (torna in revisione)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
