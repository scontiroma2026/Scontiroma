import { Card } from "@/components/ui/card";

/**
 * Tab "Log completo": tabella cronologica di ogni click su "Mostra QR" e ogni utilizzo.
 * `recent` è l'array `stats.recent` fornito dal parent.
 */
export default function AdminLog({ recent }) {
  return (
    <Card className="border-white/10 bg-white/5 p-6">
      <h3 className="font-serif text-2xl">Log cronologico QR / sconti</h3>
      <p className="text-xs text-white/50 mt-1">
        Ogni click su "Mostra QR Code" viene tracciato con utente, negozio, sconto, timestamp.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-white/50 border-b border-white/10">
              <th className="py-2">Data / Ora</th>
              <th>Codice</th>
              <th>Utente</th>
              <th>Negozio</th>
              <th>Sconto</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => {
              const dt = new Date(r.created_at);
              return (
                <tr key={r.code} className="border-b border-white/5">
                  <td className="py-2 text-white/70">
                    {dt.toLocaleDateString("it-IT")}{" "}
                    {dt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="font-mono text-ciano">{r.code}</td>
                  <td className="text-white">{r.client_name}</td>
                  <td className="text-white">{r.shop_name}</td>
                  <td className="text-white/70">{r.discount_title}</td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        r.status === "redeemed"
                          ? "bg-fucsia/20 text-fucsia"
                          : "bg-ciano/20 text-ciano"
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
