import { useEffect, useState } from "react";
import { AlertTriangle, MapPinOff, RefreshCw, Pencil, Check, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import MapPicker from "@/components/admin/MapPicker";

/**
 * Banner + lista dei merchant con indirizzi NON geocodificabili.
 * L'admin può correggere l'indirizzo inline e riprovare il geocoding.
 */
export default function GeocodeIssuesWidget({ hdrs }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAddress, setEditAddress] = useState("");
  const [retryingId, setRetryingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [pickedCoords, setPickedCoords] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/merchants/geocode-issues", hdrs());
      setIssues(r.data.issues || []);
    } catch (err) {
      // Non blocca la dashboard admin: logga in console senza toast
      console.warn("[geocode-issues] load failed:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditAddress(row.address || "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditAddress("");
  };

  const retry = async (row, useEditedAddress = false) => {
    setRetryingId(row.id);
    try {
      const body = useEditedAddress && editAddress.trim() && editAddress.trim() !== row.address
        ? { address: editAddress.trim() }
        : undefined;
      const r = await api.post(`/admin/merchants/${row.id}/geocode-retry`, body || {}, hdrs());
      if (r.data.ok) {
        toast.success(`✅ ${row.shop_name} geocodificato! (${r.data.lat.toFixed(4)}, ${r.data.lng.toFixed(4)})`);
      } else {
        toast.error(`❌ ${row.shop_name}: indirizzo ancora non trovato. Prova un formato più preciso (es. "Via del Corso 100, 00186 Roma").`);
      }
      cancelEdit();
      load();
    } catch (e) {
      toast.error("Errore durante il retry");
    } finally {
      setRetryingId(null);
    }
  };

  const confirmAddress = async (row) => {
    const body = pickedCoords ? { lat: pickedCoords[0], lng: pickedCoords[1] } : {};
    setRetryingId(row.id);
    try {
      const r = await api.post(`/admin/merchants/${row.id}/geocode-confirm`, body, hdrs());
      toast.success(
        r.data.on_map
          ? `✅ ${row.shop_name}: indirizzo confermato e negozio posizionato sulla mappa`
          : `✅ ${row.shop_name}: indirizzo confermato (il negozio non comparirà sulla mappa)`
      );
      setConfirmingId(null);
      setPickedCoords(null);
      load();
    } catch (e) {
      toast.error("Errore durante la conferma");
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) return null;
  if (issues.length === 0) return null; // Nessun problema → widget nascosto

  return (
    <Card
      data-testid="geocode-issues-widget"
      className="border-yellow-500/40 bg-yellow-500/5 p-0 overflow-hidden mb-4"
    >
      {/* Banner header */}
      <button
        data-testid="geocode-issues-toggle"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-yellow-500/10 transition"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-300">
          <MapPinOff size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-yellow-300 text-sm font-semibold">
            <AlertTriangle size={14} />
            {issues.length === 1
              ? "1 negozio ha un indirizzo non geocodificabile"
              : `${issues.length} negozi hanno indirizzi non geocodificabili`}
          </div>
          <div className="text-xs text-white/60 mt-0.5">
            Questi negozi NON compaiono sulla mappa. Correggi l'indirizzo e riprova, oppure confermalo manualmente.
          </div>
        </div>
        {open ? (
          <ChevronDown size={18} className="text-yellow-300" />
        ) : (
          <ChevronRight size={18} className="text-yellow-300" />
        )}
      </button>

      {/* Lista espandibile */}
      {open && (
        <div className="border-t border-yellow-500/20 p-4 space-y-2">
          {issues.map((row) => {
            const isEditing = editingId === row.id;
            const isRetrying = retryingId === row.id;
            return (
              <div
                key={row.id}
                data-testid={`geo-issue-${row.id}`}
                className="rounded-xl border border-white/10 bg-black/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{row.shop_name}</span>
                      {row.geocode_failed && (
                        <span className="rounded-full border border-red-500/40 bg-red-500/10 text-red-300 px-1.5 py-0.5 text-[10px] uppercase">
                          Fallito
                        </span>
                      )}
                      {row.category && (
                        <span className="rounded-full border border-white/10 bg-black/40 text-white/60 px-2 py-0.5 text-[10px]">
                          {row.category}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50 mt-1">{row.email}</div>
                    {row.phone && (
                      <div className="text-xs text-white/50">
                        <a href={`tel:${row.phone}`} className="hover:text-fucsia">{row.phone}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Indirizzo (edit inline o read-only) */}
                <div className="mt-3 rounded-lg bg-black/30 border border-white/10 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-yellow-300 mb-1">
                    Indirizzo attuale
                  </div>
                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        data-testid={`geo-issue-input-${row.id}`}
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Via, numero civico, CAP e città"
                        className="text-sm bg-black/50 border-white/10 text-white flex-1"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <Button
                          data-testid={`geo-issue-save-${row.id}`}
                          onClick={() => retry(row, true)}
                          disabled={isRetrying || !editAddress.trim()}
                          size="sm"
                          className="grad-fucsia-viola text-white h-9"
                        >
                          {isRetrying ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Check size={14} className="mr-1" /> Salva & riprova
                            </>
                          )}
                        </Button>
                        <Button
                          data-testid={`geo-issue-cancel-${row.id}`}
                          onClick={cancelEdit}
                          disabled={isRetrying}
                          variant="outline"
                          size="sm"
                          className="h-9 border-white/20 bg-transparent text-white hover:bg-white/5"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-white/80">
                        {row.address || <span className="italic text-white/40">(vuoto)</span>}
                      </div>
                      {/* 3 azioni ordinate: Riprova / Correggi / Conferma */}
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        <Button
                          data-testid={`geo-issue-retry-${row.id}`}
                          onClick={() => retry(row, false)}
                          disabled={isRetrying}
                          variant="outline"
                          size="sm"
                          className="h-9 w-full border-ciano/30 bg-ciano/10 text-ciano hover:bg-ciano/20"
                        >
                          {isRetrying ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <><RefreshCw size={12} className="mr-1" /> Riprova</>
                          )}
                        </Button>
                        <Button
                          data-testid={`geo-issue-edit-${row.id}`}
                          onClick={() => { startEdit(row); setConfirmingId(null); }}
                          variant="outline"
                          size="sm"
                          className="h-9 w-full border-fucsia/30 bg-fucsia/10 text-fucsia hover:bg-fucsia/20"
                        >
                          <Pencil size={12} className="mr-1" /> Correggi
                        </Button>
                        <Button
                          data-testid={`geo-issue-confirm-${row.id}`}
                          onClick={() => { setConfirmingId(confirmingId === row.id ? null : row.id); setPickedCoords(null); cancelEdit(); }}
                          variant="outline"
                          size="sm"
                          className="h-9 w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        >
                          <Check size={12} className="mr-1" /> Conferma
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Pannello conferma manuale con mappa cliccabile */}
                {confirmingId === row.id && (
                  <div data-testid={`geo-confirm-panel-${row.id}`} className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <div className="text-xs text-white/80">
                      L'indirizzo verrà <strong className="text-emerald-300">accettato così com'è</strong> e sparirà dagli avvisi.
                      <br />Facoltativo: <strong className="text-white">clicca sulla mappa</strong> il punto esatto del negozio per farlo comparire anche sulla mappa dell'app.
                    </div>
                    <div className="mt-3">
                      <MapPicker value={pickedCoords} onChange={setPickedCoords} />
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div data-testid={`geo-confirm-coords-label-${row.id}`} className="flex-1 text-xs text-white/60">
                        {pickedCoords
                          ? <>📍 Punto scelto: <span className="font-mono text-emerald-300">{pickedCoords[0].toFixed(5)}, {pickedCoords[1].toFixed(5)}</span></>
                          : "Nessun punto scelto — il negozio non comparirà sulla mappa."}
                      </div>
                      <Button
                        data-testid={`geo-confirm-submit-${row.id}`}
                        onClick={() => confirmAddress(row)}
                        disabled={retryingId === row.id}
                        size="sm"
                        className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        {retryingId === row.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <><Check size={14} className="mr-1" /> {pickedCoords ? "Conferma con posizione" : "Conferma comunque"}</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {row.geocode_failed_at && (
                  <div className="mt-2 text-[10px] text-white/40">
                    Ultimo tentativo: {new Date(row.geocode_failed_at).toLocaleString("it-IT")}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 text-[11px] text-white/50 italic">
            💡 Suggerimento: usa il formato <strong>"Via [nome], [numero civico], [CAP] [città]"</strong> — Nominatim (OpenStreetMap) è molto sensibile al formato.
          </div>
        </div>
      )}
    </Card>
  );
}
