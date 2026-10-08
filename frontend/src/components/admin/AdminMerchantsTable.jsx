import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Edit3, PauseCircle, PlayCircle, Unlock, EyeOff, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import AdminSearchInput from "@/components/admin/AdminSearchInput";

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
  const rejectInline = async (id) => {
    const reason = window.prompt("Rifiutare l'offerta?\n\nScrivi il motivo: il commerciante lo riceve per email e potrà correggerla.", "");
    if (reason === null) return;
    try { await api.post(`/admin/discounts/${id}/reject`, { reason }, hdrs()); toast.success("Rimandata in bozza"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
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
            editing={editing === m.id}
            form={form}
            setForm={setForm}
            busy={busy}
            onStartEdit={() => startEdit(m)}
            onSaveEdit={() => saveEdit(m.id)}
            onCancelEdit={cancelEdit}
            onToggleApprove={() => toggleApprove(m)}
            onToggleDiscountActive={() => toggleDiscountActive(m)}
            onApproveInline={() => approveInline(m.discount_id)}
            onRejectInline={() => rejectInline(m.discount_id)}
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
function MerchantRow({
  m, editing, form, setForm, busy,
  onStartEdit, onSaveEdit, onCancelEdit,
  onToggleApprove, onToggleDiscountActive,
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
