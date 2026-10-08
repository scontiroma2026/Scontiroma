import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Loader2, AlertTriangle } from "lucide-react";
import AdminSearchInput from "@/components/admin/AdminSearchInput";

const REASON_COLOR = {
  "QR code scaduto": "bg-yellow-500/15 text-amber-800 border-yellow-500/40",
  "QR code manomesso": "bg-red-500/15 text-red-700 border-red-500/40",
  "Codice non trovato": "bg-red-500/15 text-red-700 border-red-500/40",
  "Codice già utilizzato": "bg-orange-500/15 text-orange-700 border-orange-500/40",
  "Formato codice non valido": "bg-red-500/15 text-red-700 border-red-500/40",
  "Limite giornaliero: sconto già usato oggi": "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/40",
  "Limite giornaliero: cliente ha già usato lo sconto oggi": "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/40",
};

export default function FraudLog() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/admin/fraud-log")
      .then((r) => setScans(r.data.scans || []))
      .finally(() => setLoading(false));
  }, []);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? scans.filter((s) => [s.shop_name, s.reason].filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
    : scans;

  return (
    <Card data-testid="fraud-log-section" className="border-border bg-muted p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="text-red-700" size={20} />
        <h2 className="font-serif text-2xl text-foreground">Tentativi di Abuso Sventati</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {scans.length} tentativi registrati
          {scans.filter((s) => (s.reason || "").includes("giornaliero")).length > 0 && (
            <span className="ml-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/15 px-2 py-0.5 text-fuchsia-700" data-testid="daily-limit-count">
              {scans.filter((s) => (s.reason || "").includes("giornaliero")).length} blocchi limite giornaliero
            </span>
          )}
        </span>
      </div>

      <div className="mb-4">
        <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca negozio o motivo…" testId="fraud-search" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-fucsia" size={24}/></div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <AlertTriangle className="mx-auto mb-2 text-emerald-700" size={28}/>
          {q ? `Nessun tentativo trovato per "${q}".` : "Nessun tentativo di abuso registrato. Ottimo lavoro!"}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-3 pr-4">Data/Ora</th>
                <th className="py-3 pr-4">Negozio</th>
                <th className="py-3 pr-4">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const dt = s.timestamp ? new Date(s.timestamp) : null;
                const color = REASON_COLOR[s.reason] || "bg-red-500/15 text-red-700 border-red-500/40";
                return (
                  <tr key={s.id} data-testid={`fraud-row-${s.id}`} className="border-b border-border hover:bg-muted">
                    <td className="py-3 pr-4 text-foreground/80 font-mono text-xs whitespace-nowrap">
                      {dt ? dt.toLocaleString("it-IT", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "-"}
                    </td>
                    <td className="py-3 pr-4 text-foreground">{s.shop_name || <span className="text-muted-foreground">— non tracciato —</span>}</td>
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
