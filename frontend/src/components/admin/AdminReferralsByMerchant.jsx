import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  QrCode,
  Users,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Mail,
  Store,
} from "lucide-react";
import api from "@/lib/api";

const fmt = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("it-IT");
  } catch {
    return iso;
  }
};

/**
 * Admin-only: mostra attribuzione utenti ↔ QR commerciante.
 * Ogni row = un negozio con il suo QR: quanti clienti hanno scansionato,
 * quanti si sono abbonati, quanti sono attivi ora. Expandable per vedere
 * l'elenco anagrafico dei clienti attribuiti.
 */
export default function AdminReferralsByMerchant({ hdrs }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api
      .get("/admin/referrals-by-merchant", hdrs ? hdrs() : undefined)
      .then((r) => setData(r.data))
      .catch(() => setData({ error: true }));
  }, [hdrs]);

  if (!data) {
    return (
      <div data-testid="admin-referrals-loading" className="text-white/60 text-sm py-8">
        Caricamento…
      </div>
    );
  }
  if (data.error) {
    return (
      <div data-testid="admin-referrals-error" className="text-red-300 text-sm py-8">
        Impossibile caricare i dati referral.
      </div>
    );
  }

  const totals = data.totals || {};
  const merchants = data.merchants || [];
  const query = q.trim().toLowerCase();
  const filtered = query
    ? merchants.filter(
        (m) =>
          (m.shop_name || "").toLowerCase().includes(query) ||
          (m.merchant_email || "").toLowerCase().includes(query) ||
          (m.zone || "").toLowerCase().includes(query),
      )
    : merchants;

  return (
    <div data-testid="admin-referrals-panel" className="space-y-6">
      {/* Totals */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KPI icon={<Store size={14} />} label="Negozi con iscritti" value={totals.merchants_with_referrals ?? 0} testid="kpi-shops" />
        <KPI icon={<Users size={14} />} label="Iscrizioni totali via QR" value={totals.total_signups ?? 0} testid="kpi-signups" />
        <KPI icon={<TrendingUp size={14} />} label="Abbonati almeno una volta" value={totals.total_subscribed ?? 0} testid="kpi-subscribed" />
        <KPI icon={<CheckCircle2 size={14} className="text-green-400" />} label="Abbonamenti attivi" value={totals.total_active ?? 0} testid="kpi-active" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          data-testid="admin-referrals-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca negozio, email o quartiere…"
          className="bg-black/40 border-white/10 text-white placeholder:text-white/40 max-w-sm"
        />
        <span className="text-xs text-white/40">{filtered.length} negozi</span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-white/10 bg-black/30 p-6 text-center text-white/60 text-sm">
          Nessun negozio ha ancora acquisito iscritti tramite il proprio QR.
        </Card>
      )}

      {/* Rows */}
      <div className="space-y-2">
        {filtered.map((m) => {
          const isOpen = !!expanded[m.merchant_id];
          return (
            <Card
              key={m.merchant_id}
              data-testid={`referral-row-${m.merchant_id}`}
              className="border-white/10 bg-black/30 overflow-hidden"
            >
              <button
                data-testid={`referral-toggle-${m.merchant_id}`}
                onClick={() => setExpanded((s) => ({ ...s, [m.merchant_id]: !isOpen }))}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition text-left"
              >
                <span className="text-white/50">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <QrCode size={14} className="text-fucsia shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">
                      {m.shop_name}
                      {m.zone && <span className="text-white/40 text-xs ml-2">· {m.zone}</span>}
                    </div>
                    {m.merchant_email && (
                      <div className="text-[11px] text-white/40 truncate">{m.merchant_email}</div>
                    )}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <Metric label="Iscritti" value={m.total_signups} />
                  <Metric label="Abbonati" value={m.subscribed_count} accent="fucsia" />
                  <Metric label="Attivi" value={m.active_subscribers} accent="green" />
                  <Metric label="Conv." value={`${m.conversion_rate}%`} accent="ciano" />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/10 bg-black/20 px-4 py-3">
                  {/* Mobile metrics */}
                  <div className="sm:hidden mb-3 grid grid-cols-4 gap-2">
                    <MobileMetric label="Iscritti" value={m.total_signups} />
                    <MobileMetric label="Abbonati" value={m.subscribed_count} />
                    <MobileMetric label="Attivi" value={m.active_subscribers} />
                    <MobileMetric label="Conv." value={`${m.conversion_rate}%`} />
                  </div>

                  {m.clients?.length === 0 ? (
                    <div className="text-white/50 text-sm py-2">Nessun cliente attribuito.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-white/40 text-xs uppercase">
                            <th className="py-2 pr-4">Cliente</th>
                            <th className="py-2 pr-4">Email</th>
                            <th className="py-2 pr-4">Iscritto</th>
                            <th className="py-2 pr-4">Stato</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.clients.map((c) => (
                            <tr
                              key={c.id}
                              data-testid={`referral-client-${c.id}`}
                              className="border-t border-white/5"
                            >
                              <td className="py-2 pr-4 text-white">{c.name || "—"}</td>
                              <td className="py-2 pr-4 text-white/70">
                                <span className="inline-flex items-center gap-1">
                                  <Mail size={11} className="text-white/40" /> {c.email}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-white/60">
                                {fmt(c.referred_at || c.created_at)}
                              </td>
                              <td className="py-2 pr-4">
                                {c.is_active_now ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs text-green-300">
                                    <CheckCircle2 size={10} /> Attivo
                                  </span>
                                ) : c.is_subscribed ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                                    Scaduto
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-2 py-0.5 text-xs text-yellow-300">
                                    Solo registrato
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function KPI({ icon, label, value, testid }) {
  return (
    <Card
      data-testid={testid}
      className="border-white/10 bg-black/40 p-4"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/50">
        {icon} {label}
      </div>
      <div className="mt-1 font-serif text-3xl text-white font-bold">{value}</div>
    </Card>
  );
}

function Metric({ label, value, accent }) {
  const color =
    accent === "fucsia" ? "text-fucsia"
    : accent === "green" ? "text-green-400"
    : accent === "ciano" ? "text-ciano"
    : "text-white";
  return (
    <div className="text-right">
      <div className="text-[9px] uppercase text-white/40 leading-none">{label}</div>
      <div className={`font-serif text-lg font-bold ${color} leading-tight`}>{value}</div>
    </div>
  );
}

function MobileMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-2 text-center">
      <div className="text-[9px] uppercase text-white/40">{label}</div>
      <div className="font-serif text-lg text-white font-bold">{value}</div>
    </div>
  );
}
