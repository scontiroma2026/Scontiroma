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
      <div data-testid="admin-referrals-loading" className="text-muted-foreground text-sm py-8">
        Caricamento…
      </div>
    );
  }
  if (data.error) {
    return (
      <div data-testid="admin-referrals-error" className="text-red-700 text-sm py-8">
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
        <KPI icon={<CheckCircle2 size={14} className="text-emerald-700" />} label="Abbonamenti attivi" value={totals.total_active ?? 0} testid="kpi-active" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          data-testid="admin-referrals-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca negozio, email o quartiere…"
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground max-w-sm"
        />
        <span className="text-xs text-muted-foreground">{filtered.length} negozi</span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-border bg-muted p-6 text-center text-muted-foreground text-sm">
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
              className="border-border bg-muted overflow-hidden"
            >
              <button
                data-testid={`referral-toggle-${m.merchant_id}`}
                onClick={() => setExpanded((s) => ({ ...s, [m.merchant_id]: !isOpen }))}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition text-left"
              >
                <span className="text-muted-foreground">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <QrCode size={14} className="text-fucsia shrink-0" />
                  <div className="min-w-0">
                    <div className="text-foreground font-medium truncate">
                      {m.shop_name}
                      {m.zone && <span className="text-muted-foreground text-xs ml-2">· {m.zone}</span>}
                    </div>
                    {m.merchant_email && (
                      <div className="text-[11px] text-muted-foreground truncate">{m.merchant_email}</div>
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
                <div className="border-t border-border bg-muted px-4 py-3">
                  {/* Mobile metrics */}
                  <div className="sm:hidden mb-3 grid grid-cols-4 gap-2">
                    <MobileMetric label="Iscritti" value={m.total_signups} />
                    <MobileMetric label="Abbonati" value={m.subscribed_count} />
                    <MobileMetric label="Attivi" value={m.active_subscribers} />
                    <MobileMetric label="Conv." value={`${m.conversion_rate}%`} />
                  </div>

                  {m.clients?.length === 0 ? (
                    <div className="text-muted-foreground text-sm py-2">Nessun cliente attribuito.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground text-xs uppercase">
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
                              className="border-t border-border"
                            >
                              <td className="py-2 pr-4 text-foreground">{c.name || "—"}</td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Mail size={11} className="text-muted-foreground" /> {c.email}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                {fmt(c.referred_at || c.created_at)}
                              </td>
                              <td className="py-2 pr-4">
                                {c.is_active_now ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs text-emerald-700">
                                    <CheckCircle2 size={10} /> Attivo
                                  </span>
                                ) : c.is_subscribed ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    Scaduto
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-2 py-0.5 text-xs text-amber-800">
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
      className="border-border bg-muted p-4"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-serif text-3xl text-foreground font-bold">{value}</div>
    </Card>
  );
}

function Metric({ label, value, accent }) {
  const color =
    accent === "fucsia" ? "text-fucsia"
    : accent === "green" ? "text-emerald-700"
    : accent === "ciano" ? "text-ciano"
    : "text-foreground";
  return (
    <div className="text-right">
      <div className="text-[9px] uppercase text-muted-foreground leading-none">{label}</div>
      <div className={`font-serif text-lg font-bold ${color} leading-tight`}>{value}</div>
    </div>
  );
}

function MobileMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-2 text-center">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="font-serif text-lg text-foreground font-bold">{value}</div>
    </div>
  );
}
