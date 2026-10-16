import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Edit3, PauseCircle, PlayCircle, Unlock, EyeOff, Eye, Pencil, KeyRound } from "lucide-react";
import { toast } from "sonner";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import RifiutoOffertaDialog from "@/components/admin/RifiutoOffertaDialog";

/**
 * Tab "Negozi" — tabella gestione commercianti & sconti con azioni inline
 * (approva/rifiuta pending, modifica sconto in modale, sospendi merchant, elimina).
 *
 * Props:
 *  - merchants: array di commercianti (con `discount_*` embedded)
 *  - hdrs: factory di headers admin master
 *  - onRefresh: ricarica i dati del parent
 *  - onForceEdit(discountId): sblocca il lucchetto mensile
 *  - onViewDiscounts(merchantId): apre lo storico offerte del merchant
 */
export default function AdminMerchantsTable({ merchants, hdrs, onRefresh, onForceEdit, onViewDiscounts }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [discEdit, setDiscEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [daRifiutare, setDaRifiutare] = useState(null);

  const needle = q.trim().toLowerCase();
  const filteredMerchants = needle
    ? merchants.filter((m) =>
        [m.shop_name, m.email, m.zone, m.category, m.address, m.discount_title, m.phone]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
    : merchants;

  const startEdit = (m) => {
    setEditing(m.id);
    setForm({ shop_name: m.shop_name, zone: m.zone, category: m.category, address: m.address });
  };
  const cancelEdit = () => { setEditing(null); setForm({}); };

  const openDiscountEdit = async (m) => {
    if (!m.discount_id) return;
    try {
      const { data } = await api.get(`/discounts/${m.discount_id}`);
      const d = data.discount;
      setDiscEdit({
        id: d.id,
        shop_name: m.shop_name,
        title: d.title || "",
        description: d.description || "",
        original_price: d.original_price ?? "",
        discounted_price: d.discounted_price ?? "",
        terms: d.terms || "",
        image_url: d.image_url || "",
        active: d.active,
        approval_status: d.approval_status || "approved",
      });
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const saveDiscount = async () => {
    if (!discEdit) return;
    setBusy(true);
    try {
      const payload = {
        title: discEdit.title,
        description: discEdit.description,
        original_price: parseFloat(discEdit.original_price),
        discounted_price: parseFloat(discEdit.discounted_price),
        terms: discEdit.terms,
        image_url: discEdit.image_url,
        active: discEdit.active,
      };
      if (isNaN(payload.original_price) || isNaN(payload.discounted_price) || payload.discounted_price >= payload.original_price) {
        toast.error("Verifica i prezzi (scontato < originale)");
        setBusy(false);
        return;
      }
      await api.put(`/admin/discounts/${discEdit.id}`, payload, hdrs());
      toast.success("Sconto aggiornato");
      setDiscEdit(null);
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  const approveInline = async (id) => {
    if (!window.confirm("Approvare l'offerta?\n\nDiventa subito visibile ai clienti e il commerciante riceve un'email.")) return;
    try { await api.post(`/admin/discounts/${id}/approve`, {}, hdrs()); toast.success("Approvata ✓"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
  };
  const rejectInline = async (motivo) => {
    try {
      await api.post(`/admin/discounts/${daRifiutare.id}/reject`, { reason: motivo }, hdrs());
    } catch (err) {
      throw new Error(formatApiError(err));
    }
    setDaRifiutare(null);
    toast.success("Rimandata in bozza");
    onRefresh();
  };

  const toggleApprove = async (m) => {
    const msg = m.approved
      ? `Sospendere ${m.shop_name}?\n\nLa sua offerta sparisce subito dall'app e i clienti non possono più usarla. Puoi riattivarlo quando vuoi.`
      : `Riattivare ${m.shop_name}?\n\nLa sua offerta torna visibile ai clienti (se è approvata e attiva).`;
    if (!window.confirm(msg)) return;
    try {
      await api.put(`/admin/merchants/${m.id}`, { approved: !m.approved }, hdrs());
      toast.success(m.approved ? "Negozio sospeso" : "Negozio riattivato");
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const togglePagato = async (m) => {
    const sp = m.stato_pagamento;
    if (!sp) return;
    const pagato = sp.fase === "pagato";
    const msg = pagato
      ? `Togliere «pagato» a ${m.shop_name} per ${sp.mese}?`
      : `Segnare ${m.shop_name} come pagato per ${sp.mese}?\n\nÈ solo un'annotazione: nessun addebito.`;
    if (!window.confirm(msg)) return;
    try {
      if (pagato) await api.delete(`/admin/pagamenti-mensili/${m.id}/${sp.mese}`, hdrs());
      else await api.put(`/admin/pagamenti-mensili/${m.id}/${sp.mese}`, {}, hdrs());
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const saveEdit = async (id) => {
    setBusy(true);
    try {
      await api.put(`/admin/merchants/${id}`, form, hdrs());
      toast.success("Modifiche salvate");
      cancelEdit();
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  const del = async (m) => {
    if (!window.confirm(`ELIMINARE DEFINITIVAMENTE ${m.shop_name}?\n\nSi cancellano l'account del commerciante e la sua offerta. Non si può annullare.\nSe vuoi solo fermarlo per un po', usa «Sospendi».`)) return;
    try {
      await api.delete(`/admin/merchants/${m.id}`, hdrs());
      toast.success("Eliminato");
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const delDiscount = async (id, shopName) => {
    if (!id) return toast.error("Nessuno sconto da eliminare");
    if (!window.confirm(`Eliminare l'offerta di ${shopName}?\n\nL'offerta sparisce e il commerciante dovrà crearne una nuova. Il negozio resta iscritto.`)) return;
    try {
      await api.delete(`/admin/discounts/${id}`, hdrs());
      toast.success("Sconto eliminato");
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const toggleDiscountActive = async (m) => {
    if (!m.discount_id) return;
    if (!window.confirm(m.discount_active
      ? `Nascondere l'offerta di ${m.shop_name}?\n\nNon compare più ai clienti finché non la rendi di nuovo visibile.`
      : `Rendere di nuovo visibile l'offerta di ${m.shop_name}?`)) return;
    try {
      await api.put(`/admin/discounts/${m.discount_id}`, { active: !m.discount_active }, hdrs());
      toast.success(m.discount_active ? "Offerta nascosta" : "Offerta di nuovo visibile");
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <Card className="border-border bg-muted p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">Gestione commercianti & offerte</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Ogni azione chiede conferma e spiega cosa succede. «Sospendi» ferma il negozio senza cancellarlo.
          </p>
        </div>
        <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca negozio, email, zona…" testId="merchants-search" />
      </div>

      <div className="mt-4 space-y-3">
        {filteredMerchants.length === 0 && <p className="text-sm text-muted-foreground">Nessun negozio.</p>}
        {filteredMerchants.map((m) => (
          <MerchantRow
            key={m.id}
            m={m}
            hdrs={hdrs}
            editing={editing === m.id}
            form={form}
            setForm={setForm}
            busy={busy}
            onStartEdit={() => startEdit(m)}
            onSaveEdit={() => saveEdit(m.id)}
            onCancelEdit={cancelEdit}
            onToggleApprove={() => toggleApprove(m)}
            onTogglePagato={() => togglePagato(m)}
            onToggleDiscountActive={() => toggleDiscountActive(m)}
            onApproveInline={() => approveInline(m.discount_id)}
            onRejectInline={() => setDaRifiutare({ id: m.discount_id, titolo: m.discount_title })}
            onOpenDiscountEdit={() => openDiscountEdit(m)}
            onForceEdit={() => onForceEdit(m.discount_id)}
            onDelDiscount={() => delDiscount(m.discount_id, m.shop_name)}
            onDelMerchant={() => del(m)}
            onViewDiscounts={() => onViewDiscounts?.(m.id)}
          />
        ))}
      </div>

      {discEdit && (
        <DiscountEditModal
          discEdit={discEdit}
          setDiscEdit={setDiscEdit}
          onSave={saveDiscount}
          busy={busy}
        />
      )}
      <RifiutoOffertaDialog aperta={!!daRifiutare} titolo={daRifiutare?.titolo} onChiudi={() => setDaRifiutare(null)} onConferma={rejectInline} />
    </Card>
  );
}

const STATO_OFFERTA = {
  pending: { testo: "In attesa di approvazione", cls: "bg-amber-400/15 text-amber-800 border-amber-400/40" },
  approved: { testo: "Approvata", cls: "bg-emerald-400/15 text-emerald-700 border-emerald-400/40" },
  rejected: { testo: "Rifiutata", cls: "bg-red-500/15 text-red-700 border-red-500/40" },
  expired: { testo: "Scaduta", cls: "bg-muted text-muted-foreground border-border" },
};

// Pulsante con icona e scritta: si capisce cosa fa anche da telefono (niente solo-icone).
function Azione({ testid, onClick, icon: Icon, children, tono = "neutro", disabled }) {
  const toni = {
    verde: "bg-emerald-500/20 text-emerald-800 border-emerald-400/40 hover:bg-emerald-500/30",
    rosso: "bg-red-500/15 text-red-800 border-red-500/40 hover:bg-red-500/25",
    giallo: "bg-amber-400/15 text-amber-800 border-amber-400/40 hover:bg-amber-400/25",
    neutro: "bg-muted text-foreground border-border hover:bg-muted",
  };
  return (
    <button type="button" data-testid={testid} onClick={onClick} disabled={disabled}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${toni[tono]}`}>
      {Icon && <Icon size={14} />} {children}
    </button>
  );
}

/**
 * Scheda di un commerciante: dati del negozio, la sua offerta con lo stato in italiano e
 * le azioni scritte per esteso, divise tra "Offerta" e "Negozio".
 */
const ggmm = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");
function testoStatoPagamento(sp) {
  if (!sp) return "";
  if (sp.fase === "in_prova") return `In prova fino al ${ggmm(sp.prova_fino_al)} · primo pagamento il ${ggmm(sp.primo_pagamento)}`;
  if (sp.fase === "pagato") return "Pagato questo mese";
  if (sp.fase === "da_pagare") return "Da pagare";
  return "Prova non ancora iniziata (nessuna offerta pubblicata)";
}

function MerchantRow({
  m, hdrs, editing, form, setForm, busy,
  onStartEdit, onSaveEdit, onCancelEdit,
  onToggleApprove, onTogglePagato, onToggleDiscountActive,
  onApproveInline, onRejectInline, onOpenDiscountEdit,
  onForceEdit, onDelDiscount, onDelMerchant, onViewDiscounts,
}) {
  const stato = STATO_OFFERTA[m.discount_approval] || STATO_OFFERTA.approved;
  return (
    <div data-testid={`admin-merchant-${m.id}`} className={`rounded-2xl border p-4 ${m.approved ? "border-border bg-muted" : "border-red-500/40 bg-red-500/5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="Nome negozio" className="bg-muted border-border text-foreground h-9 text-sm" />
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Indirizzo" className="bg-muted border-border text-foreground h-9 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Zona" className="bg-muted border-border text-foreground h-9 text-xs" />
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Categoria" className="bg-muted border-border text-foreground h-9 text-xs" />
              </div>
            </div>
          ) : (
            <>
              <div className="text-lg font-semibold text-foreground break-words">{m.shop_name}</div>
              <div className="text-xs text-muted-foreground break-all">{m.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.zone} · {m.category} · <span className="text-fucsia font-semibold">{m.redemptions_count}</span> sconti usati</div>
              {m.phone && (
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-mono">{m.phone}</span>
                  <a
                    data-testid={`wa-link-${m.id}`}
                    href={`https://wa.me/${(m.phone || "").replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(`Ciao ${m.name || m.shop_name}, ti scrivo da Sconti Roma...`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-700 hover:bg-emerald-800 px-2 py-0.5 text-[10px] font-medium text-white"
                  >WhatsApp</a>
                </div>
              )}
            </>
          )}
        </div>
        <span data-testid={`admin-merchant-stato-${m.id}`} className={`rounded-full border px-3 py-1 text-xs font-semibold ${m.approved ? "border-emerald-400/40 text-emerald-700" : "border-red-500/40 text-red-700"}`}>
          {m.approved ? "Negozio attivo" : "Negozio sospeso"}
        </span>
      </div>

      {m.stato_pagamento && (
        <div data-testid={`admin-merchant-pagamento-${m.id}`} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-border px-2.5 py-0.5 font-semibold text-foreground">{testoStatoPagamento(m.stato_pagamento)}</span>
          {(m.stato_pagamento.fase === "pagato" || m.stato_pagamento.fase === "da_pagare") && (
            <button type="button" onClick={onTogglePagato} data-testid={`admin-toggle-pagato-${m.id}`}
              className="min-h-9 rounded-full border border-border px-3 font-semibold text-foreground hover:bg-muted">
              {m.stato_pagamento.fase === "pagato" ? "Togli «pagato»" : "Segna pagato"}
            </button>
          )}
        </div>
      )}

      {/* Offerta */}
      <div className="mt-3 rounded-xl border border-border bg-muted p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Offerta</div>
          {m.has_discount && (
            <div className="flex flex-wrap gap-1.5">
              <span data-testid={`admin-offerta-stato-${m.id}`} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stato.cls}`}>{stato.testo}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${m.discount_active ? "border-ciano/40 text-ciano" : "border-border text-muted-foreground"}`}>
                {m.discount_active ? "Visibile" : "Nascosta"}
              </span>
            </div>
          )}
        </div>
        {m.has_discount ? (
          <>
            <div className="mt-1 font-serif text-base text-foreground break-words">{m.discount_title || "(senza titolo)"}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {m.discount_approval === "pending" && (
                <>
                  <Azione testid={`inline-approve-${m.discount_id}`} onClick={onApproveInline} icon={Check} tono="verde">Approva</Azione>
                  <Azione testid={`inline-reject-${m.discount_id}`} onClick={onRejectInline} icon={X} tono="rosso">Rifiuta</Azione>
                </>
              )}
              <Azione testid={`edit-discount-${m.discount_id}`} onClick={onOpenDiscountEdit} icon={Pencil}>Modifica</Azione>
              <Azione testid={`toggle-discount-${m.discount_id}`} onClick={onToggleDiscountActive} icon={m.discount_active ? EyeOff : Eye} tono="giallo">
                {m.discount_active ? "Nascondi" : "Rendi visibile"}
              </Azione>
              <Azione testid={`admin-force-edit-${m.discount_id}`} onClick={onForceEdit} icon={Unlock}>Permetti modifica al commerciante</Azione>
              <Azione testid={`admin-delete-discount-${m.discount_id}`} onClick={onDelDiscount} icon={Trash2} tono="rosso">Elimina offerta</Azione>
            </div>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Nessuna offerta caricata.</p>
        )}
        <button type="button" data-testid={`view-discounts-${m.id}`} onClick={onViewDiscounts} className="mt-2 inline-flex min-h-11 items-center text-xs text-ciano underline-offset-2 hover:underline">
          Storico offerte →
        </button>
      </div>

      {!editing && <AdminShopCode m={m} hdrs={hdrs} />}
      {!editing && <AdminStatistiche m={m} hdrs={hdrs} />}

      {/* Negozio */}
      <div className="mt-3 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Azione testid={`admin-merchant-save-${m.id}`} onClick={onSaveEdit} icon={Check} tono="verde" disabled={busy}>Salva</Azione>
            <Azione testid={`admin-merchant-cancel-${m.id}`} onClick={onCancelEdit} icon={X}>Annulla</Azione>
          </>
        ) : (
          <>
            <Azione testid={`admin-merchant-edit-${m.id}`} onClick={onStartEdit} icon={Edit3}>Modifica dati negozio</Azione>
            <Azione testid={`admin-merchant-toggle-${m.id}`} onClick={onToggleApprove} icon={m.approved ? PauseCircle : PlayCircle} tono={m.approved ? "giallo" : "verde"}>
              {m.approved ? "Sospendi negozio" : "Riattiva negozio"}
            </Azione>
            <Azione testid={`admin-merchant-delete-${m.id}`} onClick={onDelMerchant} icon={Trash2} tono="rosso">Elimina negozio</Azione>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Statistiche del negozio per l'admin: sempre complete, senza la soglia dei 3 clienti che vale per il
 * commerciante. Solo numeri, mai nomi; si caricano solo quando l'admin le apre.
 */
function AdminStatistiche({ m, hdrs }) {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const mostra = async () => {
    setBusy(true);
    try { const { data } = await api.get(`/admin/merchants/${m.id}/insights`, hdrs()); setD(data); }
    catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };
  const Num = ({ etichetta, valore, testid }) => (
    <div className="rounded-lg border border-border bg-white p-2 text-center">
      <div data-testid={testid} className="font-serif text-xl font-bold text-foreground">{valore}</div>
      <div className="text-[11px] leading-tight text-muted-foreground">{etichetta}</div>
    </div>
  );
  return (
    <div data-testid={`admin-statistiche-${m.id}`} className="mt-3 rounded-xl border border-border bg-muted p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Statistiche del negozio (solo numeri)</div>
      {!d ? (
        <div className="mt-2"><Azione testid={`stat-show-${m.id}`} onClick={mostra} icon={Eye} disabled={busy}>Mostra statistiche</Azione></div>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">{d.mese}: tu le vedi sempre; il commerciante vede i dettagli sui clienti solo da 3 clienti diversi nel mese.</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Num etichetta="Sconti usati nel mese" valore={d.utilizzi_mese} testid={`stat-utilizzi-${m.id}`} />
            <Num etichetta="Clienti nel mese" valore={d.clienti_mese ?? 0} testid={`stat-clienti-${m.id}`} />
            <Num etichetta="Clienti nuovi" valore={d.clienti_nuovi ?? 0} testid={`stat-nuovi-${m.id}`} />
            <Num etichetta="Tornati" valore={d.clienti_di_ritorno ?? 0} testid={`stat-ritorno-${m.id}`} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Ultimi 6 mesi: {d.ultimi_6_mesi.map((x) => `${x.mese.slice(0, 3)} ${x.utilizzi}`).join(" · ")}</p>
          <div className="mt-2"><Azione testid={`stat-hide-${m.id}`} onClick={() => setD(null)} icon={EyeOff}>Nascondi</Azione></div>
        </>
      )}
    </div>
  );
}

/**
 * Codice a 4 cifre del negozio: solo l'admin, un negozio alla volta, caricato solo quando lo chiede
 * (non sta mai nella lista dei commercianti). «Rigenera» vale come per il commerciante: il vecchio
 * codice smette di valere e i telefoni «ricordati» si scollegano.
 */
function AdminShopCode({ m, hdrs }) {
  const [dati, setDati] = useState(null);
  const [conferma, setConferma] = useState(false);
  const [busy, setBusy] = useState(false);
  const id = m.id;

  const mostra = async () => {
    setBusy(true);
    try { const { data } = await api.get(`/admin/merchants/${id}/shop-code`, hdrs()); setDati(data); }
    catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };
  const rigenera = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/merchants/${id}/shop-code/regenerate`, {}, hdrs());
      setDati(data); setConferma(false);
      toast.success("Nuovo codice attivo. Il vecchio non vale più.");
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div data-testid={`admin-shopcode-${id}`} className="mt-3 rounded-xl border border-border bg-muted p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Codice del negozio (al banco)</div>
      {!dati ? (
        <div className="mt-2">
          <Azione testid={`shopcode-show-${id}`} onClick={mostra} icon={KeyRound} disabled={busy}>Mostra codice</Azione>
        </div>
      ) : (
        <>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span data-testid={`shopcode-value-${id}`} aria-label={`Codice ${dati.code.split("").join(" ")}`}
              className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">{dati.code}</span>
            <span className="text-xs text-muted-foreground">versione {dati.version}</span>
            <Azione testid={`shopcode-hide-${id}`} onClick={() => { setDati(null); setConferma(false); }} icon={EyeOff}>Nascondi</Azione>
          </div>
          {!conferma ? (
            <div className="mt-2"><Azione testid={`shopcode-regen-${id}`} onClick={() => setConferma(true)} icon={KeyRound} tono="giallo">Rigenera codice</Azione></div>
          ) : (
            <div role="alert" className="mt-2">
              <p className="text-xs text-foreground">Il codice attuale smette di valere subito, anche sui telefoni che lo ricordano. Rigenerarlo?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Azione testid={`shopcode-regen-confirm-${id}`} onClick={rigenera} icon={Check} tono="giallo" disabled={busy}>Sì, rigenera</Azione>
                <Azione testid={`shopcode-regen-cancel-${id}`} onClick={() => setConferma(false)} icon={X} disabled={busy}>Annulla</Azione>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Modale di modifica completa di uno sconto (title, prezzo, termini, immagine, attivo).
 */
function DiscountEditModal({ discEdit, setDiscEdit, onSave, busy }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => setDiscEdit(null)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase text-ciano tracking-wider">Modifica sconto</div>
            <h3 className="font-serif text-2xl text-foreground">{discEdit.shop_name}</h3>
          </div>
          <button onClick={() => setDiscEdit(null)} className="rounded-md bg-muted p-2 text-foreground">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-xs">Titolo</Label>
            <Input data-testid="admin-disc-title" value={discEdit.title} onChange={(e) => setDiscEdit({ ...discEdit, title: e.target.value })} className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Descrizione</Label>
            <Input value={discEdit.description} onChange={(e) => setDiscEdit({ ...discEdit, description: e.target.value })} className="bg-muted border-border text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Prezzo originale (€)</Label>
              <Input data-testid="admin-disc-original" type="number" step="0.01" value={discEdit.original_price} onChange={(e) => setDiscEdit({ ...discEdit, original_price: e.target.value })} className="bg-muted border-border text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Prezzo scontato (€)</Label>
              <Input data-testid="admin-disc-discounted" type="number" step="0.01" value={discEdit.discounted_price} onChange={(e) => setDiscEdit({ ...discEdit, discounted_price: e.target.value })} className="bg-muted border-border text-foreground" />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Termini</Label>
            <Input value={discEdit.terms} onChange={(e) => setDiscEdit({ ...discEdit, terms: e.target.value })} className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Immagine (URL)</Label>
            <Input value={discEdit.image_url} onChange={(e) => setDiscEdit({ ...discEdit, image_url: e.target.value })} placeholder="https://... o dataURL" className="bg-muted border-border text-foreground text-xs" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
            <span className="text-sm text-foreground">Sconto attivo</span>
            <input type="checkbox" checked={discEdit.active} onChange={(e) => setDiscEdit({ ...discEdit, active: e.target.checked })} className="h-5 w-5 accent-fucsia" />
          </div>
          <Button data-testid="admin-disc-save" onClick={onSave} disabled={busy} className="w-full grad-fucsia-viola text-white rounded-full">
            {busy ? "Salvataggio…" : "Salva modifiche"}
          </Button>
        </div>
      </div>
    </div>
  );
}
