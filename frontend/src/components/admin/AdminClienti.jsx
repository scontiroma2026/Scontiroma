import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminSearchInput from "@/components/admin/AdminSearchInput";

/** Elenco clienti (solo admin con master password) e eliminazione definitiva: richieste di cancellazione e pulizie. */
export default function AdminClienti({ hdrs }) {
  const [clienti, setClienti] = useState(null);
  const [q, setQ] = useState("");
  const carica = useCallback(() => {
    api.get("/admin/clients", hdrs()).then((r) => setClienti(r.data.clients)).catch((e) => toast.error(formatApiError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { carica(); }, [carica]);

  const elimina = async (c) => {
    if (!window.confirm(`Eliminare definitivamente ${c.name || c.email} e tutti i suoi dati? Non si può annullare.`)) return;
    try {
      await api.delete(`/admin/clients/${c.id}`, hdrs());
      toast.success("Cliente eliminato");
      carica();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!clienti) return <p className="text-muted-foreground">Caricamento…</p>;
  const ago = q.trim().toLowerCase();
  const visibili = ago ? clienti.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(ago)) : clienti;
  return (
    <Card className="border-border bg-muted p-6" data-testid="admin-clienti">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">Clienti ({clienti.length})</h3>
          <p className="mt-1 text-xs text-muted-foreground">Eliminazione definitiva, con tutti i dati collegati (come una richiesta di cancellazione).</p>
        </div>
        <AdminSearchInput value={q} onChange={setQ} placeholder="Cerca nome o email…" testId="clienti-search" />
      </div>
      <ul className="mt-4 divide-y divide-border">
        {visibili.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate"><strong>{c.name || "-"}</strong> <span className="text-muted-foreground">{c.email}</span></span>
            <Button size="sm" variant="outline" data-testid={`cliente-elimina-${c.id}`} onClick={() => elimina(c)}>Elimina</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
