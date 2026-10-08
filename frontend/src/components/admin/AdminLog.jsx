import { useState } from "react";
import { Card } from "@/components/ui/card";
import AdminSearchInput from "@/components/admin/AdminSearchInput";

/**
 * Tab "Log completo": tabella cronologica di ogni click su "Mostra QR" e ogni utilizzo.
 * `recent` è l'array `stats.recent` fornito dal parent.
 */
export default function AdminLog({ recent }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? recent.filter((r) =>
        [r.code, r.client_name, r.shop_name, r.discount_title]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
    : recent;

  return (
    <Card className="border-border bg-muted p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">Log cronologico QR / sconti</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Ogni click su "Mostra QR Code" viene tracciato con utente, negozio, sconto, timestamp.
          </p>
        </div>
        <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca codice, utente, negozio…" testId="log-search" />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <th className="py-2">Data / Ora</th>
              <th>Codice</th>
              <th>Utente</th>
              <th>Negozio</th>
              <th>Sconto</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{q ? `Nessun risultato per "${q}".` : "Nessun evento registrato."}</td></tr>
            )}
            {filtered.map((r) => {
              const dt = new Date(r.created_at);
              return (
                <tr key={r.code} className="border-b border-border">
                  <td className="py-2 text-muted-foreground">
                    {dt.toLocaleDateString("it-IT")}{" "}
                    {dt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="font-mono text-ciano">{r.code}</td>
                  <td className="text-foreground">{r.client_name}</td>
                  <td className="text-foreground">{r.shop_name}</td>
                  <td className="text-muted-foreground">{r.discount_title}</td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        r.status === "redeemed"
                          ? "bg-fucsia/10 text-fucsia"
                          : "bg-ciano/10 text-ciano"
                      }`}
                    >
                      {r.status === "redeemed" ? "Utilizzato" : "QR aperto"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
