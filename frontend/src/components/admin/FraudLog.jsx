import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Loader2, AlertTriangle } from "lucide-react";

const REASON_COLOR = {
  "QR code scaduto": "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  "QR code manomesso": "bg-red-500/15 text-red-300 border-red-500/40",
  "Codice non trovato": "bg-red-500/15 text-red-300 border-red-500/40",
  "Codice già utilizzato": "bg-orange-500/15 text-orange-300 border-orange-500/40",
  "Formato codice non valido": "bg-red-500/15 text-red-300 border-red-500/40",
};

export default function FraudLog() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/fraud-log")
      .then((r) => setScans(r.data.scans || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card data-testid="fraud-log-section" className="border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="text-red-400" size={20} />
        <h2 className="font-serif text-2xl text-white">Tentativi di Abuso Sventati</h2>
        <span className="ml-auto text-xs text-white/50">{scans.length} tentativi registrati</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-fucsia" size={24}/></div>
      )}

      {!loading && scans.length === 0 && (
        <div className="text-center py-10 text-white/50">
          <AlertTriangle className="mx-auto mb-2 text-green-400" size={28}/>
          Nessun tentativo di abuso registrato. Ottimo lavoro!
        </div>
      )}

      {!loading && scans.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/60 border-b border-white/10">
                <th className="py-3 pr-4">Data/Ora</th>
                <th className="py-3 pr-4">Negozio</th>
                <th className="py-3 pr-4">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => {
                const dt = s.timestamp ? new Date(s.timestamp) : null;
                const color = REASON_COLOR[s.reason] || "bg-red-500/15 text-red-300 border-red-500/40";
                return (
                  <tr key={s.id} data-testid={`fraud-row-${s.id}`} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 pr-4 text-white/80 font-mono text-xs whitespace-nowrap">
                      {dt ? dt.toLocaleString("it-IT", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "-"}
                    </td>
                    <td className="py-3 pr-4 text-white">{s.shop_name || <span className="text-white/40">— non tracciato —</span>}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-xs ${color}`}>{s.reason}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
