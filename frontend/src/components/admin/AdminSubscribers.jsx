import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Store,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const fmt = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};

const statusPill = (status) => {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs text-green-300">
        <CheckCircle2 size={10} /> Attivo
      </span>
    );
  if (status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
        <XCircle size={10} /> Disdetto
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white/60">
      <Clock size={10} /> {status || "—"}
    </span>
  );
};

const providerBadge = (p) => {
  if (!p) return null;
  const colors =
    p === "stripe"
      ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-300"
      : "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${colors} px-2 py-0.5 text-[10px] uppercase`}
    >
      <CreditCard size={10} /> {p}
    </span>
  );
};

export default function AdminSubscribers({ hdrs }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter_status", filter);
      if (q) params.set("q", q);
      const r = await api.get(`/admin/subscribers?${params.toString()}`, hdrs());
      setList(r.data.subscribers || []);
    } catch (e) {
      toast.error("Errore caricamento abbonati");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const totals = {
    all: list.length,
    active: list.filter((r) => r.current_status === "active").length,
    cancelled: list.filter((r) => r.current_status === "cancelled").length,
  };

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <Card data-testid="admin-subscribers-card" className="border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-2xl flex items-center gap-2">
            <Users size={22} className="text-fucsia" /> Abbonati — LOG completo
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Conferme, disdette (con data/ora), rinnovi, sconti riscattati e negozi frequentati.
          </p>
        </div>
        <Button
          data-testid="subs-refresh"
          onClick={load}
          variant="outline"
          size="sm"
          className="border-white/20 bg-transparent text-white hover:bg-white/5"
        >
          <RefreshCw size={14} className="mr-2" /> Aggiorna
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[
          { k: "all", label: `Tutti (${totals.all})` },
          { k: "active", label: `Attivi (${totals.active})` },
          { k: "cancelled", label: `Disdetti (${totals.cancelled})` },
        ].map((f) => (
          <button
            key={f.k}
            data-testid={`subs-filter-${f.k}`}
            onClick={() => setFilter(f.k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filter === f.k
                ? "bg-fucsia text-white"
                : "border border-white/15 bg-black/40 text-white/70 hover:border-white/30"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Input
            data-testid="subs-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Cerca email o nome…"
            className="h-8 w-56 bg-black/40 border-white/10 text-sm"
          />
          <Button size="sm" onClick={load} className="grad-fucsia-viola text-white h-8">
            Cerca
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 text-center text-white/50 py-8">Caricamento…</div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-10 text-center text-white/60">
          Nessun abbonato trovato con i filtri correnti.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-white/50 border-b border-white/10">
                <th className="py-2"></th>
                <th className="py-2">Utente</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Attivato</th>
                <th className="py-2">Scadenza</th>
                <th className="py-2">Disdetto</th>
                <th className="py-2 text-center">Rinnovi</th>
                <th className="py-2 text-center">Sconti usati</th>
                <th className="py-2 text-center">Stato</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const u = row.user;
                const s = row.latest_subscription || {};
                const isOpen = !!expanded[u.id];
                return (
                  <>
                    <tr
                      key={u.id}
                      data-testid={`subs-row-${u.id}`}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => toggle(u.id)}
                    >
                      <td className="py-3 w-6 text-white/50">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="py-3">
                        <div className="text-white font-medium truncate max-w-[180px]">{u.name || "—"}</div>
                        <div className="text-white/50 text-xs truncate max-w-[180px]">{u.email}</div>
                      </td>
                      <td className="py-3">{providerBadge(s.provider)}</td>
                      <td className="py-3 text-white/70 text-xs">{fmt(s.start_date)}</td>
                      <td className="py-3 text-white/70 text-xs">{fmt(s.end_date)}</td>
                      <td className="py-3 text-white/70 text-xs">
                        {s.cancelled_at ? (
                          <span className="text-red-300">{fmt(s.cancelled_at)}</span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className={row.renewals_count > 0 ? "text-ciano font-bold" : "text-white/40"}>
                          {row.renewals_count}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={row.total_redemptions > 0 ? "text-fucsia font-bold" : "text-white/40"}>
                          {row.total_redemptions}
                        </span>
                      </td>
                      <td className="py-3 text-center">{statusPill(row.current_status)}</td>
                    </tr>
                    {isOpen && (
                      <tr data-testid={`subs-detail-${u.id}`}>
                        <td colSpan={9} className="bg-black/40 border-b border-white/10 p-5">
                          <SubscriberDetail row={row} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function SubscriberDetail({ row }) {
  const u = row.user;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Colonna 1 — Anagrafica */}
      <div>
        <div className="text-xs uppercase tracking-wider text-gold mb-2">Anagrafica</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-white/80">
            <Mail size={12} /> <a href={`mailto:${u.email}`} className="text-fucsia hover:underline">{u.email}</a>
          </div>
          {u.phone && (
            <div className="flex items-center gap-2 text-white/80">
              <Phone size={12} /> {u.phone}
            </div>
          )}
          <div className="text-white/50 mt-2">
            Registrato: <span className="text-white/80">{fmt(u.created_at)}</span>
          </div>
          <div className="text-white/50">
            Scadenza attuale:{" "}
            <span className="text-white/80">{fmt(u.data_scadenza_abbonamento)}</span>
          </div>
          {u.consents && (
            <div className="mt-2 text-[10px] text-white/50">
              Consenso legale:{" "}
              {u.consents.legal_accepted ? (
                <span className="text-green-400">✓ {fmt(u.consents.legal_accepted_at)}</span>
              ) : (
                <span className="text-red-400">✗ non accettato</span>
              )}
              <br />
              Marketing opt-in:{" "}
              {u.consents.marketing_opt_in ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-white/50">✗</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Colonna 2 — Storico abbonamenti + rinnovi */}
      <div>
        <div className="text-xs uppercase tracking-wider text-gold mb-2">Storico abbonamenti</div>
        <div className="space-y-2 text-xs">
          {row.subscriptions_history.map((s) => (
            <div key={s.id} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <div className="flex items-center justify-between">
                {statusPill(s.status)}
                {providerBadge(s.provider)}
              </div>
              <div className="mt-1 text-white/70">
                Attivato: <span className="text-white">{fmt(s.start_date)}</span>
              </div>
              <div className="text-white/70">
                Scadenza: <span className="text-white">{fmt(s.end_date)}</span>
              </div>
              {s.cancelled_at && (
                <>
                  <div className="text-red-300">
                    Disdetto: <span className="text-red-200 font-mono">{fmt(s.cancelled_at)}</span>
                  </div>
                  {s.cancelled_reason && (
                    <div className="text-white/50 text-[10px] italic">
                      Motivo: {s.cancelled_reason}
                      {s.cancelled_feedback && ` — "${s.cancelled_feedback}"`}
                    </div>
                  )}
                </>
              )}
              {s.last_renewal_at && (
                <div className="text-ciano text-[10px]">
                  Ultimo rinnovo: {fmt(s.last_renewal_at)}
                </div>
              )}
            </div>
          ))}
        </div>

        {row.renewal_events.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-gold mb-2">
              Rinnovi ({row.renewals_count})
            </div>
            <div className="space-y-1 text-[11px] font-mono max-h-40 overflow-y-auto">
              {row.renewal_events.map((r) => (
                <div key={r.provider_event_id} className="text-white/70 border-b border-white/5 py-1">
                  <span className="text-ciano">{fmt(r.processed_at)}</span> ·{" "}
                  <span className="text-fucsia">€{Number(r.amount_eur || 0).toFixed(2)}</span> ·{" "}
                  <span className="text-white/50">{r.provider}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Colonna 3 — Sconti riscattati per negozio */}
      <div>
        <div className="text-xs uppercase tracking-wider text-gold mb-2 flex items-center gap-1">
          <Store size={12} /> Sconti riscattati ({row.total_redemptions})
        </div>
        {row.shops_used.length === 0 ? (
          <div className="text-xs text-white/50 italic">Nessuno sconto usato finora</div>
        ) : (
          <div className="space-y-2">
            {row.shops_used.map((s) => (
              <div key={s.merchant_id} className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{s.shop_name}</span>
                  <span className="text-fucsia font-bold">{s.count}×</span>
                </div>
                <div className="text-white/40 text-[10px] mt-0.5">
                  {s.zone || "—"} · ultimo uso: {fmt(s.last_redeemed_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
