import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Pagina aperta dal link dell'email della lista d'attesa (/lista-attesa/conferma?token=…).
// La conferma parte con POST da qui, non con un GET sul link: gli antivirus della posta aprono i link e la consumerebbero.
export default function ListaAttesaConferma() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [stato, setStato] = useState(token ? "attesa" : "errore"); // attesa | ok | errore
  const [scaduto, setScaduto] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let annullato = false;
    api.post("/prelaunch/waitlist/confirm", { token })
      .then(() => { if (!annullato) setStato("ok"); })
      .catch((err) => {
        if (annullato) return;
        setScaduto(err?.response?.data?.detail?.code === "link_scaduto");
        setStato("errore");
      });
    return () => { annullato = true; };
  }, [token]);

  return (
    <main data-testid="lista-attesa-conferma-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-border bg-muted p-8">
        {stato === "attesa" && (
          <div className="flex items-center gap-3 text-foreground" role="status">
            <Loader2 className="animate-spin" size={24} /> Sto confermando la tua iscrizione…
          </div>
        )}
        {stato === "ok" && (
          <div data-testid="lista-attesa-conferma-ok">
            <CheckCircle2 size={40} className="text-fucsia" aria-hidden="true" />
            <h1 className="mt-3 font-serif text-4xl text-foreground">Iscrizione confermata</h1>
            <p className="mt-2 text-foreground/80">Grazie! Ti scriviamo noi quando Sconti Roma è online. Nel frattempo non ti mandiamo altro.</p>
            <Button asChild className="mt-6 w-full min-h-11 grad-fucsia-viola text-white rounded-full">
              <Link to="/">Torna alla home</Link>
            </Button>
          </div>
        )}
        {stato === "errore" && (
          <div data-testid="lista-attesa-conferma-errore">
            <AlertCircle size={40} className="text-fucsia" aria-hidden="true" />
            <h1 className="mt-3 font-serif text-3xl text-foreground">{scaduto ? "Il link è scaduto" : "Link non valido"}</h1>
            <p className="mt-2 text-foreground/80">
              {scaduto
                ? "Il link di conferma vale 48 ore. Se vuoi, iscriviti di nuovo dalla home: ti mandiamo un link nuovo."
                : "Questo link non è valido o è già stato usato. Se hai già confermato, non devi fare altro; altrimenti iscriviti di nuovo dalla home."}
            </p>
            <Button asChild variant="outline" className="mt-6 w-full min-h-11 rounded-full">
              <Link to="/">Vai alla home</Link>
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
