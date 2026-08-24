import { Card } from "@/components/ui/card";
import { Users, Store, Zap, TrendingUp, Euro, Calendar } from "lucide-react";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

/**
 * Tab "Analytics" della admin dashboard: KPI + grafici (30 giorni, per giorno, per orario)
 * + classifica negozi e clienti.
 * Solo presentazionale: riceve `stats` già caricato dal parent.
 */
export default function AdminAnalytics({ stats }) {
  const maxHour = Math.max(...stats.by_hour, 1);
  const maxDay = Math.max(...stats.by_weekday, 1);
  const maxDaily = Math.max(...stats.daily.map((d) => d.count), 1);

  return (
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
              <div
                key={d.date}
                title={`${d.date}: ${d.count}`}
                className="flex-1 rounded-t grad-fucsia-viola hover:opacity-80"
                style={{ height: `${(d.count / maxDaily) * 100}%` }}
              />
            ))}
          </div>
        </Card>
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="font-serif text-2xl">Per giorno settimana</h3>
          <div className="mt-4 flex h-40 items-end gap-3">
            {stats.by_weekday.map((c, i) => (
              <div key={`day-${i}`} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-ciano"
                  style={{ height: `${(c / maxDay) * 100}%`, minHeight: 4 }}
                />
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
            <div key={`hour-${i}`} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-neon"
                style={{ height: `${(c / maxHour) * 100}%`, minHeight: 2 }}
                title={`${i}:00`}
              />
              {i % 3 === 0 && <span className="text-[10px] text-white/50">{i}h</span>}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="font-serif text-2xl">🏆 Classifica negozi</h3>
          <div className="mt-4 space-y-2">
            {stats.top_merchants.length === 0 && (
              <div className="text-white/50 text-sm">Ancora nessun dato</div>
            )}
            {stats.top_merchants.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl text-fucsia w-8">#{i + 1}</span>
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
            {stats.top_clients.length === 0 && (
              <div className="text-white/50 text-sm">Ancora nessun dato</div>
            )}
            {stats.top_clients.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl text-ciano w-8">#{i + 1}</span>
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
