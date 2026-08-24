import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";

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
    try { await api.post(`/admin/discounts/${id}/approve`, {}, hdrs()); toast.success("Approvata ✓"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
  };
  const rejectInline = async (id) => {
    const reason = window.prompt("Motivo del rifiuto:", "") || "";
    try { await api.post(`/admin/discounts/${id}/reject`, { reason }, hdrs()); toast.success("Rimandata in bozza"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
  };

  const toggleApprove = async (m) => {
    try {
      await api.put(`/admin/merchants/${m.id}`, { approved: !m.approved }, hdrs());
      toast.success(m.approved ? "Sospeso" : "Approvato");
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
    if (!window.confirm(`Eliminare ${m.shop_name} e il suo sconto? L'azione è irreversibile.`)) return;
    try {
      await api.delete(`/admin/merchants/${m.id}`, hdrs());
      toast.success("Eliminato");
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const delDiscount = async (id, shopName) => {
    if (!id) return toast.error("Nessuno sconto da eliminare");
    if (!window.confirm(`Eliminare lo sconto di ${shopName}?`)) return;
    try {
      await api.delete(`/admin/discounts/${id}`, hdrs());
      toast.success("Sconto eliminato");
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const toggleDiscountActive = async (m) => {
    if (!m.discount_id) return;
    try {
      await api.put(`/admin/discounts/${m.discount_id}`, { active: !m.discount_active }, hdrs());
      toast.success("Sconto aggiornato");
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <Card className="border-white/10 bg-white/5 p-6">
      <h3 className="font-serif text-2xl">Gestione commercianti & offerte</h3>
      <p className="text-xs text-white/50 mt-1">
        Modifica, elimina, approva/rifiuta. Tutte le azioni sono immediate.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-white/50 border-b border-white/10">
              <th className="py-2">Negozio</th>
              <th>Zona / Categoria</th>
              <th>Offerta</th>
              <th>Utilizzi</th>
              <th>Stato</th>
              <th className="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
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
          </tbody>
        </table>
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

/**
 * Riga singola nella tabella merchants. Estratta per leggibilità.
 */
function MerchantRow({
  m, editing, form, setForm, busy,
  onStartEdit, onSaveEdit, onCancelEdit,
  onToggleApprove, onToggleDiscountActive,
  onApproveInline, onRejectInline, onOpenDiscountEdit,
  onForceEdit, onDelDiscount, onDelMerchant, onViewDiscounts,
}) {
  return (
    <tr className="border-b border-white/5 align-top">
      <td className="py-3">
        {editing ? (
          <div className="space-y-2">
            <Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} className="bg-black/40 border-white/10 text-white h-8 text-sm" />
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Indirizzo" className="bg-black/40 border-white/10 text-white h-8 text-xs" />
          </div>
        ) : (
          <>
            <div className="text-white font-semibold">{m.shop_name}</div>
            <div className="text-xs text-white/60">{m.email}</div>
            {m.phone && (
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="text-white/70 font-mono">{m.phone}</span>
                <a
                  data-testid={`wa-link-${m.id}`}
                  href={`https://wa.me/${(m.phone || "").replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(`Ciao ${m.name || m.shop_name}, ti scrivo da Sconti Roma...`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-green-500 hover:bg-green-400 px-2 py-0.5 text-[10px] font-medium text-white"
                >WhatsApp</a>
              </div>
            )}
            <button
              type="button"
              data-testid={`view-discounts-${m.id}`}
              onClick={onViewDiscounts}
              className="mt-2 text-xs text-ciano hover:underline"
            >
              Vedi tutte le offerte →
            </button>
          </>
        )}
      </td>
      <td className="py-3">
        {editing ? (
          <div className="space-y-2">
            <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="bg-black/40 border-white/10 text-white h-8 text-xs" />
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-black/40 border-white/10 text-white h-8 text-xs" />
          </div>
        ) : (
          <>
            <div className="text-white/80">{m.zone}</div>
            <div className="text-xs text-white/50">{m.category}</div>
          </>
        )}
      </td>
      <td className="py-3">
        {m.has_discount ? (
          <>
            <div className="text-white/90 font-serif text-base max-w-[240px] truncate" title={m.discount_title}>
              {m.discount_title || "(senza titolo)"}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wider flex-wrap">
              <span className={`rounded-full px-2 py-0.5 ${
                m.discount_approval === "pending" ? "bg-neon/20 text-neon"
                  : m.discount_approval === "rejected" ? "bg-destructive/20 text-destructive"
                  : "bg-fucsia/20 text-fucsia"
              }`}>
                {m.discount_approval || "approved"}
              </span>
              <button
                onClick={onToggleDiscountActive}
                className={`${m.discount_active ? "text-ciano" : "text-white/50 line-through"} hover:underline`}
              >
                {m.discount_active ? "● attivo" : "○ inattivo"}
              </button>
            </div>
          </>
        ) : (
          <span className="text-xs text-white/40">nessuna offerta</span>
        )}
      </td>
      <td className="py-3 font-serif text-2xl text-fucsia">{m.redemptions_count}</td>
      <td className="py-3">
        <button
          onClick={onToggleApprove}
          className={`rounded-full px-3 py-1 text-xs ${
            m.approved ? "bg-fucsia/20 text-fucsia" : "bg-white/10 text-white/50"
          }`}
        >
          {m.approved ? "Approvato" : "Sospeso"}
        </button>
      </td>
      <td className="py-3 text-right">
        {editing ? (
          <div className="flex justify-end gap-2">
            <button data-testid={`admin-merchant-save-${m.id}`} onClick={onSaveEdit} disabled={busy} className="rounded-md bg-fucsia/20 hover:bg-fucsia/30 p-2 text-fucsia" title="Salva"><Check size={14} /></button>
            <button data-testid={`admin-merchant-cancel-${m.id}`} onClick={onCancelEdit} className="rounded-md bg-white/10 p-2 text-white" title="Annulla"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex justify-end gap-1 flex-wrap">
            {m.discount_approval === "pending" && (
              <>
                <button data-testid={`inline-approve-${m.discount_id}`} onClick={onApproveInline} className="rounded-md bg-fucsia/20 hover:bg-fucsia/30 p-2 text-fucsia" title="Approva offerta"><Check size={14} /></button>
                <button data-testid={`inline-reject-${m.discount_id}`} onClick={onRejectInline} className="rounded-md bg-neon/20 hover:bg-neon/30 p-2 text-neon" title="Rifiuta"><X size={14} /></button>
              </>
            )}
            {m.discount_id && (
              <button data-testid={`edit-discount-${m.discount_id}`} onClick={onOpenDiscountEdit} className="rounded-md bg-ciano/20 hover:bg-ciano/30 p-2 text-ciano" title="Modifica offerta">📝</button>
            )}
            {m.discount_id && (
              <button data-testid={`admin-force-edit-${m.discount_id}`} onClick={onForceEdit} className="rounded-md bg-neon/20 hover:bg-neon/30 p-2 text-neon" title="Sblocca modifica (lucchetto)">🔓</button>
            )}
            {m.discount_id && (
              <button data-testid={`admin-delete-discount-${m.discount_id}`} onClick={onDelDiscount} className="rounded-md bg-destructive/20 hover:bg-destructive/30 p-2 text-destructive" title="Elimina solo sconto"><Trash2 size={14} /></button>
            )}
            <button data-testid={`admin-merchant-edit-${m.id}`} onClick={onStartEdit} className="rounded-md bg-white/10 hover:bg-white/20 p-2 text-white" title="Modifica negozio"><Edit3 size={14} /></button>
            <button data-testid={`admin-merchant-delete-${m.id}`} onClick={onDelMerchant} className="rounded-md bg-destructive/30 hover:bg-destructive/40 p-2 text-white" title="Elimina negozio"><Trash2 size={14} /></button>
          </div>
        )}
      </td>
    </tr>
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
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141414] p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase text-ciano tracking-wider">Modifica sconto</div>
            <h3 className="font-serif text-2xl text-white">{discEdit.shop_name}</h3>
          </div>
          <button onClick={() => setDiscEdit(null)} className="rounded-md bg-white/10 p-2 text-white">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-white/70 text-xs">Titolo</Label>
            <Input data-testid="admin-disc-title" value={discEdit.title} onChange={(e) => setDiscEdit({ ...discEdit, title: e.target.value })} className="bg-black/40 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-white/70 text-xs">Descrizione</Label>
            <Input value={discEdit.description} onChange={(e) => setDiscEdit({ ...discEdit, description: e.target.value })} className="bg-black/40 border-white/10 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-xs">Prezzo originale (€)</Label>
              <Input data-testid="admin-disc-original" type="number" step="0.01" value={discEdit.original_price} onChange={(e) => setDiscEdit({ ...discEdit, original_price: e.target.value })} className="bg-black/40 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Prezzo scontato (€)</Label>
              <Input data-testid="admin-disc-discounted" type="number" step="0.01" value={discEdit.discounted_price} onChange={(e) => setDiscEdit({ ...discEdit, discounted_price: e.target.value })} className="bg-black/40 border-white/10 text-white" />
            </div>
          </div>
          <div>
            <Label className="text-white/70 text-xs">Termini</Label>
            <Input value={discEdit.terms} onChange={(e) => setDiscEdit({ ...discEdit, terms: e.target.value })} className="bg-black/40 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-white/70 text-xs">Immagine (URL)</Label>
            <Input value={discEdit.image_url} onChange={(e) => setDiscEdit({ ...discEdit, image_url: e.target.value })} placeholder="https://... o dataURL" className="bg-black/40 border-white/10 text-white text-xs" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-3">
            <span className="text-sm text-white">Sconto attivo</span>
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
