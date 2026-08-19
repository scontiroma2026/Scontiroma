import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Users, Store, Zap, TrendingUp, Euro, Calendar } from "lucide-react";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);

  if (!stats) return <div className="mx-auto max-w-7xl px-6 py-16 text-white/60">Caricamento…</div>;

  const maxHour = Math.max(...stats.by_hour, 1);
  const maxDay = Math.max(...stats.by_weekday, 1);
  const maxDaily = Math.max(...stats.daily.map(d => d.count), 1);

  return (
    <main data-testid="admin-dashboard" className="mx-auto max-w-7xl px-6 py-12 text-white">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-ciano">Admin · Cabina di regia</div>
        <h1 className="mt-2 font-serif text-5xl text-grad">Sconti Roma Insights</h1>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={<Users size={18} />} label="Clienti" value={stats.totals.clients} c="fucsia" />
        <Kpi icon={<Store size={18} />} label="Commercianti" value={stats.totals.merchants} c="ciano" />
        <Kpi icon={<Zap size={18} />} label="Abbonati attivi" value={stats.totals.active_subscriptions} c="neon" />
        <Kpi icon={<Euro size={18} />} label="MRR" value={`€${stats.totals.mrr_eur}`} c="fucsia" />
        <Kpi icon={<TrendingUp size={18} />} label="Sconti mese" value={stats.totals.redemptions_this_month} c="ciano" />
        <Kpi icon={<Calendar size={18} />} label="Totale sconti" value={stats.totals.total_redemptions} c="neon" />
      </div>

      {/* Charts row */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Daily bars */}
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="font-serif text-2xl text-white">Ultimi 30 giorni</h3>
          <div className="mt-4 flex h-40 items-end gap-1">
            {stats.daily.map((d) => (
              <div key={d.date} title={`${d.date}: ${d.count}`} className="group flex-1 rounded-t grad-fucsia-viola transition-all hover:opacity-80" style={{height: `${(d.count / maxDaily) * 100}%`}} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/40">
            <span>{stats.daily[0]?.date.slice(5) || ""}</span>
            <span>{stats.daily[stats.daily.length - 1]?.date.slice(5) || ""}</span>
          </div>
        </Card>

        {/* By weekday */}
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="font-serif text-2xl text-white">Per giorno della settimana</h3>
          <div className="mt-4 flex h-40 items-end gap-3">
            {stats.by_weekday.map((c, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t bg-ciano transition-all" style={{height: `${(c / maxDay) * 100}%`, minHeight: 4}} title={`${c}`} />
                <span className="text-xs text-white/60">{WEEKDAYS[i]}</span>
                <span className="text-[10px] text-ciano font-bold">{c}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* By hour */}
      <Card className="mt-6 border-white/10 bg-white/5 p-6">
        <h3 className="font-serif text-2xl text-white">Per orario del giorno</h3>
        <div className="mt-4 flex h-32 items-end gap-1">
          {stats.by_hour.map((c, i) => (
            <div key={i} className="group flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-neon transition-all group-hover:opacity-80" style={{height: `${(c / maxHour) * 100}%`, minHeight: 2}} title={`${i}:00 - ${c}`} />
              {i % 3 === 0 && <span className="text-[10px] text-white/50">{i}h</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Top merchants + top clients */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="font-serif text-2xl text-white">🏆 Negozi più utilizzati</h3>
          <div className="mt-4 space-y-2">
            {stats.top_merchants.length === 0 && <div className="text-white/50 text-sm">Nessun dato ancora</div>}
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
          <h3 className="font-serif text-2xl text-white">⭐ Clienti più attivi</h3>
          <div className="mt-4 space-y-2">
            {stats.top_clients.length === 0 && <div className="text-white/50 text-sm">Nessun dato ancora</div>}
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

      {/* Recent */}
      <Card className="mt-8 border-white/10 bg-white/5 p-6">
        <h3 className="font-serif text-2xl text-white">Ultimi codici (log)</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-white/50 border-b border-white/10">
                <th className="py-2">Data / Ora</th><th>Codice</th><th>Cliente</th><th>Negozio</th><th>Offerta</th><th>Stato</th>
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
                        {r.status === 'redeemed' ? 'Utilizzato' : 'In attesa'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

function Kpi({ icon, label, value, c }) {
  return (
    <Card className="border-white/10 bg-white/5 p-4">
      <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider text-${c}`}>
        {icon} {label}
      </div>
      <div className="mt-2 font-serif text-3xl text-white">{value}</div>
    </Card>
  );
}
