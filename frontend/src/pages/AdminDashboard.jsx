import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Store, Zap, TrendingUp, Euro, Calendar, Lock, Check, X, Trash2, Edit3, ShieldAlert, LogOut } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function AdminDashboard() {
  const [gated, setGated] = useState(true);
  const [masterPw, setMasterPw] = useState("");
  const [masterToken, setMasterToken] = useState(localStorage.getItem("admin_master_token") || "");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("analytics");

  // Add master token to api calls
  const hdrs = () => masterToken ? { headers: { "X-Admin-Master": masterToken } } : {};

  useEffect(() => {
    if (masterToken) checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data } = await api.get("/admin/session", hdrs());
      if (data.master_verified) {
        setGated(false);
        loadData();
      } else {
        setGated(true);
      }
    } catch { setGated(true); }
  };

  const verifyMaster = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/admin/verify-master", { password: masterPw });
      setMasterToken(data.token);
      localStorage.setItem("admin_master_token", data.token);
      setGated(false);
      toast.success("Sblocco riuscito ✦");
      setMasterPw("");
      loadData();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  const lockOut = async () => {
    await api.post("/admin/logout-master").catch(() => {});
    localStorage.removeItem("admin_master_token");
    setMasterToken("");
    setGated(true);
  };

  const loadData = async () => {
    try {
      const [s, m, p] = await Promise.all([
        api.get("/admin/stats", hdrs()),
        api.get("/admin/merchants", hdrs()),
        api.get("/admin/discounts/pending", hdrs()),
      ]);
      setStats(s.data);
      setMerchants(m.data.merchants || []);
      setPending(p.data.discounts || []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) { setGated(true); localStorage.removeItem("admin_master_token"); setMasterToken(""); }
      else toast.error(formatApiError(err));
    }
  };

  const approveDiscount = async (id) => {
    try { await api.post(`/admin/discounts/${id}/approve`, {}, hdrs()); toast.success("Offerta approvata ✓"); loadData(); }
    catch (err) { toast.error(formatApiError(err)); }
  };
  const rejectDiscount = async (id) => {
    const reason = window.prompt("Motivo del rifiuto (visibile al commerciante):", "") || "";
    try { await api.post(`/admin/discounts/${id}/reject`, { reason }, hdrs()); toast.success("Offerta rimandata in bozza"); loadData(); }
    catch (err) { toast.error(formatApiError(err)); }
  };
  const forceEdit = async (id) => {
    if (!window.confirm("Consentire al commerciante di modificare l'offerta questo mese?")) return;
    try { await api.post(`/admin/discounts/${id}/force-edit`, {}, hdrs()); toast.success("Sblocco concesso"); loadData(); }
    catch (err) { toast.error(formatApiError(err)); }
  };

  if (gated) {
    return (
      <main className="mx-auto max-w-md px-6 py-20">
        <Card className="border-white/10 bg-white/5 p-8">
          <div className="flex items-center gap-3 text-fucsia">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fucsia/20 glow-fucsia">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ciano">Area riservata</div>
              <h1 className="font-serif text-3xl text-white">Master Password</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/60">Inserisci la master password per accedere ai dati sensibili.</p>
          <form onSubmit={verifyMaster} className="mt-6 space-y-4">
            <PasswordInput
              data-testid="master-pw"
              placeholder="•••••••••••••"
              value={masterPw}
              onChange={(e) => setMasterPw(e.target.value)}
              autoFocus
              className="bg-black/40 border-white/10 text-white"
            />
            <Button data-testid="master-submit" type="submit" disabled={busy || !masterPw} className="w-full grad-fucsia-viola text-white rounded-full py-6">
              <Lock size={14} className="mr-2" /> {busy ? "Verifica…" : "Sblocca"}
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  if (!stats) return <div className="mx-auto max-w-7xl px-6 py-16 text-white/60">Caricamento…</div>;

  const maxHour = Math.max(...stats.by_hour, 1);
  const maxDay = Math.max(...stats.by_weekday, 1);
  const maxDaily = Math.max(...stats.daily.map(d => d.count), 1);

  return (
    <main data-testid="admin-dashboard" className="mx-auto max-w-7xl px-6 py-12 text-white">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ciano">Admin · Cabina di regia</div>
          <h1 className="mt-2 font-serif text-5xl text-grad">Sconti Roma Insights</h1>
        </div>
        <Button variant="outline" onClick={lockOut} className="rounded-full border-white/20 text-white hover:bg-white/10">
          <LogOut size={14} className="mr-2" /> Blocca
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/10 flex-wrap">
        {[["analytics","Analytics"], ["pending", `Offerte in attesa (${pending.length})`], ["merchants",`Negozi (${merchants.length})`], ["log","Log completo"]].map(([k, l]) => (
          <button
            key={k}
            data-testid={`tab-${k}`}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm border-b-2 transition ${tab === k ? "border-fucsia text-fucsia" : "border-transparent text-white/60 hover:text-white"}`}
          >{l}</button>
        ))}
      </div>

      {tab === "analytics" && (
        <>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Kpi icon={<Users size={18} />} label="Clienti" value={stats.totals.clients} c="fucsia" />
            <Kpi icon={<Store size={18} />} label="Commercianti" value={stats.totals.merchants} c="ciano" />
            <Kpi icon={<Zap size={18} />} label="Abbonati attivi" value={stats.totals.active_subscriptions} c="neon" />
            <Kpi icon={<Euro size={18} />} label="MRR" value={`€${stats.totals.mrr_eur}`} c="fucsia" />
            <Kpi icon={<TrendingUp size={18} />} label="Sconti mese" value={stats.totals.redemptions_this_month} c="ciano" />
            <Kpi icon={<Calendar size={18} />} label="Totale sconti" value={stats.totals.total_redemptions} c="neon" />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 p-6">
              <h3 className="font-serif text-2xl">Ultimi 30 giorni</h3>
              <div className="mt-4 flex h-40 items-end gap-1">
                {stats.daily.map((d) => (
                  <div key={d.date} title={`${d.date}: ${d.count}`} className="flex-1 rounded-t grad-fucsia-viola hover:opacity-80" style={{height: `${(d.count / maxDaily) * 100}%`}} />
                ))}
              </div>
            </Card>
            <Card className="border-white/10 bg-white/5 p-6">
              <h3 className="font-serif text-2xl">Per giorno settimana</h3>
              <div className="mt-4 flex h-40 items-end gap-3">
                {stats.by_weekday.map((c, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t bg-ciano" style={{height: `${(c / maxDay) * 100}%`, minHeight: 4}} />
                    <span className="text-xs text-white/60">{WEEKDAYS[i]}</span>
                    <span className="text-[10px] text-ciano font-bold">{c}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-6 border-white/10 bg-white/5 p-6">
            <h3 className="font-serif text-2xl">Per orario</h3>
            <div className="mt-4 flex h-32 items-end gap-1">
              {stats.by_hour.map((c, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-neon" style={{height: `${(c / maxHour) * 100}%`, minHeight: 2}} title={`${i}:00`} />
                  {i % 3 === 0 && <span className="text-[10px] text-white/50">{i}h</span>}
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-white/5 p-6">
              <h3 className="font-serif text-2xl">🏆 Classifica negozi</h3>
              <div className="mt-4 space-y-2">
                {stats.top_merchants.length === 0 && <div className="text-white/50 text-sm">Ancora nessun dato</div>}
                {stats.top_merchants.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl text-fucsia w-8">#{i+1}</span>
                      <div>
                        <div className="text-white font-semibold">{m.shop_name}</div>
                        <div className="text-xs text-white/60">{m.zone} · {m.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-2xl text-ciano">{m.redemptions}</div>
                      <div className="text-[10px] uppercase text-white/50">sconti</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="border-white/10 bg-white/5 p-6">
              <h3 className="font-serif text-2xl">⭐ Clienti più attivi</h3>
              <div className="mt-4 space-y-2">
                {stats.top_clients.length === 0 && <div className="text-white/50 text-sm">Ancora nessun dato</div>}
                {stats.top_clients.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl text-ciano w-8">#{i+1}</span>
                      <div>
                        <div className="text-white font-semibold">{c.name}</div>
                        <div className="text-xs text-white/60">{c.email}</div>
                      </div>
                    </div>
                    <div className="font-serif text-2xl text-fucsia">{c.redemptions}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === "merchants" && (
        <MerchantsTable merchants={merchants} onRefresh={loadData} hdrs={hdrs} onForceEdit={forceEdit} />
      )}

      {tab === "pending" && (
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="font-serif text-2xl">Offerte in attesa di approvazione</h3>
          <p className="text-xs text-white/50 mt-1">Approva per pubblicare subito, o rifiuta per rimandare in bozza al commerciante.</p>
          {pending.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-10 text-center text-white/60">
              🎉 Nessuna offerta in attesa. Ottimo lavoro!
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {pending.map((d) => (
                <div key={d.id} data-testid={`pending-${d.id}`} className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto] gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
                  <img src={d.image_url || d.merchant?.image_url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ciano">{d.merchant?.shop_name} · {d.merchant?.zone}</div>
                    <div className="font-serif text-xl text-white mt-1">{d.title}</div>
                    <p className="text-sm text-white/70 mt-1 line-clamp-2">{d.description}</p>
                    <div className="mt-2 flex items-baseline gap-2 text-sm">
                      <span className="text-fucsia font-bold text-lg">€{d.discounted_price?.toFixed(2)}</span>
                      <span className="text-white/40 line-through">€{d.original_price?.toFixed(2)}</span>
                      <span className="ml-2 text-neon text-xs">−{d.percent_off}%</span>
                    </div>
                    {d.terms && <div className="mt-2 text-xs text-white/50">Termini: {d.terms}</div>}
                  </div>
                  <div className="flex flex-col gap-2 md:justify-center">
                    <Button data-testid={`approve-${d.id}`} onClick={() => approveDiscount(d.id)} className="grad-fucsia-viola text-white rounded-full">
                      <Check size={14} className="mr-1" /> Approva
                    </Button>
                    <Button data-testid={`reject-${d.id}`} onClick={() => rejectDiscount(d.id)} variant="outline" className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10">
                      <X size={14} className="mr-1" /> Rifiuta
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "log" && (
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="font-serif text-2xl">Log cronologico QR / sconti</h3>
          <p className="text-xs text-white/50 mt-1">Ogni click su "Mostra QR Code" viene tracciato con utente, negozio, sconto, timestamp.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-white/50 border-b border-white/10">
                  <th className="py-2">Data / Ora</th><th>Codice</th><th>Utente (ID)</th><th>Negozio</th><th>Sconto</th><th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r) => {
                  const dt = new Date(r.created_at);
                  return (
                    <tr key={r.code} className="border-b border-white/5">
                      <td className="py-2 text-white/70">{dt.toLocaleDateString("it-IT")} {dt.toLocaleTimeString("it-IT", {hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="font-mono text-ciano">{r.code}</td>
                      <td className="text-white">{r.client_name}</td>
                      <td className="text-white">{r.shop_name}</td>
                      <td className="text-white/70">{r.discount_title}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${r.status === 'redeemed' ? 'bg-fucsia/20 text-fucsia' : 'bg-ciano/20 text-ciano'}`}>
                          {r.status === 'redeemed' ? 'Utilizzato' : 'QR aperto'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}

function Kpi({ icon, label, value, c }) {
  return (
    <Card className="border-white/10 bg-white/5 p-4">
      <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider text-${c}`}>{icon} {label}</div>
      <div className="mt-2 font-serif text-3xl text-white">{value}</div>
    </Card>
  );
}

function MerchantsTable({ merchants, onRefresh, hdrs, onForceEdit }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const startEdit = (m) => { setEditing(m.id); setForm({ shop_name: m.shop_name, zone: m.zone, category: m.category, address: m.address }); };
  const cancelEdit = () => { setEditing(null); setForm({}); };

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
      cancelEdit(); onRefresh();
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
      <h3 className="font-serif text-2xl">Gestione commercianti</h3>
      <p className="text-xs text-white/50 mt-1">Approva, modifica o elimina i profili e i loro sconti.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-white/50 border-b border-white/10">
              <th className="py-2">Negozio</th><th>Zona / Categoria</th><th>Sconto</th><th>Utilizzi</th><th>Stato</th><th className="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-b border-white/5 align-top">
                <td className="py-3">
                  {editing === m.id ? (
                    <div className="space-y-2">
                      <Input value={form.shop_name} onChange={(e) => setForm({...form, shop_name: e.target.value})} className="bg-black/40 border-white/10 text-white h-8 text-sm" />
                      <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="Indirizzo" className="bg-black/40 border-white/10 text-white h-8 text-xs" />
                    </div>
                  ) : (
                    <>
                      <div className="text-white font-semibold">{m.shop_name}</div>
                      <div className="text-xs text-white/60">{m.email}</div>
                    </>
                  )}
                </td>
                <td className="py-3">
                  {editing === m.id ? (
                    <div className="space-y-2">
                      <Input value={form.zone} onChange={(e) => setForm({...form, zone: e.target.value})} className="bg-black/40 border-white/10 text-white h-8 text-xs" />
                      <Input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="bg-black/40 border-white/10 text-white h-8 text-xs" />
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
                      <div className="text-white/80 max-w-[220px] truncate">{m.discount_title}</div>
                      <button onClick={() => toggleDiscountActive(m)} className={`mt-1 text-[10px] uppercase tracking-wider ${m.discount_active ? 'text-ciano' : 'text-white/50 line-through'} hover:underline`}>
                        {m.discount_active ? '● attivo' : '○ inattivo'}
                      </button>
                    </>
                  ) : <span className="text-xs text-white/40">nessuno</span>}
                </td>
                <td className="py-3 font-serif text-2xl text-fucsia">{m.redemptions_count}</td>
                <td className="py-3">
                  <button onClick={() => toggleApprove(m)} className={`rounded-full px-3 py-1 text-xs ${m.approved ? 'bg-fucsia/20 text-fucsia' : 'bg-white/10 text-white/50'}`}>
                    {m.approved ? 'Approvato' : 'Sospeso'}
                  </button>
                </td>
                <td className="py-3 text-right">
                  {editing === m.id ? (
                    <div className="flex justify-end gap-2">
                      <button data-testid={`admin-merchant-save-${m.id}`} onClick={() => saveEdit(m.id)} disabled={busy} className="rounded-md bg-fucsia/20 hover:bg-fucsia/30 p-2 text-fucsia" title="Salva"><Check size={14} /></button>
                      <button data-testid={`admin-merchant-cancel-${m.id}`} onClick={cancelEdit} className="rounded-md bg-white/10 p-2 text-white" title="Annulla"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      {m.discount_id && (
                        <button data-testid={`admin-force-edit-${m.discount_id}`} onClick={() => onForceEdit(m.discount_id)} className="rounded-md bg-ciano/20 hover:bg-ciano/30 p-2 text-ciano" title="Sblocca modifica per il commerciante">🔓</button>
                      )}
                      <button data-testid={`admin-merchant-edit-${m.id}`} onClick={() => startEdit(m)} className="rounded-md bg-white/10 hover:bg-white/20 p-2 text-white" title="Modifica"><Edit3 size={14} /></button>
                      <button data-testid={`admin-merchant-delete-${m.id}`} onClick={() => del(m)} className="rounded-md bg-destructive/20 hover:bg-destructive/30 p-2 text-destructive" title="Elimina"><Trash2 size={14} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
