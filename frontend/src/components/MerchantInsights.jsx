import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

/** Statistiche del commerciante: solo numeri aggregati, mai nomi dei clienti. */
export default function MerchantInsights() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/merchants/me/insights").then((r) => setD(r.data)).catch(() => {}); }, []);
  if (!d) return null;
  const max = Math.max(1, ...d.ultimi_6_mesi.map((x) => x.utilizzi));
  const top = d.giorni ? [...d.giorni].sort((a, b) => b.utilizzi - a.utilizzi)[0] : null;
  return (
    <Card data-testid="merchant-insights" className="border-white/10 bg-[#141414] p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold"><BarChart3 size={14} /> I tuoi clienti · {d.mese}</div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero label="Sconti usati nel mese" valore={d.utilizzi_mese} testid="ins-utilizzi" />
        {d.dati_sufficienti ? (
          <>
            <Numero label="Clienti nel mese" valore={d.clienti_mese} testid="ins-clienti" />
            <Numero label="Clienti nuovi" valore={d.clienti_nuovi} testid="ins-nuovi" />
            <Numero label="Tornati da te" valore={d.clienti_di_ritorno} testid="ins-ritorno" />
          </>
        ) : (
          <p data-testid="ins-insufficienti" className="col-span-1 text-xs text-white/60 sm:col-span-3">
            I dettagli sui clienti compaiono quando nel mese ti hanno scelto almeno 3 clienti diversi.
          </p>
        )}
      </div>
      {top && top.utilizzi > 0 && (
        <p className="mt-3 text-sm text-white/70">Il giorno con più sconti usati: <strong className="text-white">{top.giorno}</strong>.</p>
      )}
      <div className="mt-4">
        <div className="text-xs text-white/50">Ultimi 6 mesi</div>
        <div className="mt-2 flex h-24 items-end gap-2">
          {d.ultimi_6_mesi.map((x) => (
            <div key={x.mese} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-[10px] text-white/70">{x.utilizzi}</div>
              <div className="w-full rounded-t bg-fucsia/60" style={{ height: `${Math.max(4, (x.utilizzi / max) * 64)}px` }} />
              <div className="text-[10px] text-white/50">{x.mese.slice(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Numero({ label, valore, testid }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div data-testid={testid} className="font-serif text-3xl text-white">{valore}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-white/50">{label}</div>
    </div>
  );
}
