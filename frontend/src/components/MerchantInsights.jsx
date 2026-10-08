import { useEffect, useState } from "react";
import api from "@/lib/api";
import { BarChart3 } from "lucide-react";
import { Scheda } from "@/components/AreaUI";

/** Statistiche del commerciante: solo numeri aggregati, mai nomi dei clienti. */
export default function MerchantInsights() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/merchants/me/insights").then((r) => setD(r.data)).catch(() => {}); }, []);
  if (!d) return null;
  const max = Math.max(1, ...d.ultimi_6_mesi.map((x) => x.utilizzi));
  const top = d.giorni ? [...d.giorni].sort((a, b) => b.utilizzi - a.utilizzi)[0] : null;
  return (
    <Scheda
      data-testid="merchant-insights"
      titolo={`I tuoi clienti · ${d.mese}`}
      tono="teal"
      icona={<BarChart3 size={15} />}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Numero label="Sconti usati nel mese" valore={d.utilizzi_mese} testid="ins-utilizzi" tono="rosa" />
        {d.dati_sufficienti ? (
          <>
            <Numero label="Clienti nel mese" valore={d.clienti_mese} testid="ins-clienti" tono="teal" />
            <Numero label="Clienti nuovi" valore={d.clienti_nuovi} testid="ins-nuovi" tono="viola" />
            <Numero label="Tornati da te" valore={d.clienti_di_ritorno} testid="ins-ritorno" tono="verde" />
          </>
        ) : (
          <p data-testid="ins-insufficienti" className="col-span-1 flex items-center rounded-[14px] bg-ac-tint p-3 text-xs font-semibold leading-snug text-ac-soft sm:col-span-3">
            I dettagli sui clienti compaiono quando nel mese ti hanno scelto almeno 3 clienti diversi.
          </p>
        )}
      </div>
      {top && top.utilizzi > 0 && (
        <p className="mt-3 text-sm text-ac-soft">Il giorno con più sconti usati: <strong className="text-ac-ink">{top.giorno}</strong>.</p>
      )}
      <div className="mt-4">
        <div className="text-xs font-bold text-ac-mute">Ultimi 6 mesi</div>
        <div className="mt-2 flex h-28 items-end gap-2">
          {d.ultimi_6_mesi.map((x) => (
            <div key={x.mese} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-xs font-bold text-ac-ink">{x.utilizzi}</div>
              <div className="ac-grad w-full rounded-t-md" style={{ height: `${Math.max(4, (x.utilizzi / max) * 64)}px` }} />
              <div className="text-[11px] font-semibold text-ac-mute">{x.mese.slice(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>
    </Scheda>
  );
}

const FONDI = {
  rosa: "bg-ac-rosaBg text-ac-rosa",
  teal: "bg-ac-tealBg text-ac-teal",
  viola: "bg-ac-violaBg text-ac-viola",
  verde: "bg-ac-verdeBg text-ac-verde",
};

function Numero({ label, valore, testid, tono }) {
  return (
    <div className={`rounded-[14px] p-3 ${FONDI[tono]}`}>
      <div data-testid={testid} className="font-serif text-[30px] font-bold leading-[1.05]">{valore}</div>
      <div className="mt-1 text-xs font-semibold leading-snug text-ac-soft">{label}</div>
    </div>
  );
}
