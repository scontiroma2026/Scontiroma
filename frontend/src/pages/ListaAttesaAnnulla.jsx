import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Pagina aperta dal link «Annulla l'iscrizione» di ogni email della lista d'attesa (/lista-attesa/annulla?i=…&t=…).
// La disiscrizione parte con POST da qui: un GET del link (antivirus, anteprime) non deve cancellare nessuno.
export default function ListaAttesaAnnulla() {
  const [params] = useSearchParams();
  const i = params.get("i") || "";
  const t = params.get("t") || "";
  const [stato, setStato] = useState(i && t ? "attesa" : "errore"); // attesa | ok | errore

  useEffect(() => {
    if (!i || !t) return undefined;
    let annullato = false;
    api.post("/prelaunch/waitlist/unsubscribe", { i, t })
      .then(() => { if (!annullato) setStato("ok"); })
      .catch(() => { if (!annullato) setStato("errore"); });
    return () => { annullato = true; };
  }, [i, t]);

  return (
    <main data-testid="lista-attesa-annulla-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-border bg-muted p-8">
        {stato === "attesa" && (
          <div className="flex items-center gap-3 text-foreground" role="status">
            <Loader2 className="animate-spin" size={24} /> Un momento…
          </div>
        )}
        {stato === "ok" && (
          <div data-testid="lista-attesa-annulla-ok">
            <CheckCircle2 size={40} className="text-fucsia" aria-hidden="true" />
            <h1 className="mt-3 font-serif text-4xl text-foreground">Non riceverai più email</h1>
            <p className="mt-2 text-foreground/80">Abbiamo tolto il tuo indirizzo dalla lista d'attesa di Sconti Roma. Se cambi idea, puoi iscriverti di nuovo quando vuoi.</p>
            <Button asChild className="mt-6 w-full min-h-11 grad-fucsia-viola text-white rounded-full">
              <Link to="/">Vai alla home</Link>
            </Button>
          </div>
        )}
        {stato === "errore" && (
          <div data-testid="lista-attesa-annulla-errore">
            <AlertCircle size={40} className="text-fucsia" aria-hidden="true" />
            <h1 className="mt-3 font-serif text-3xl text-foreground">Link non valido</h1>
            <p className="mt-2 text-foreground/80">Questo link non è valido. Usa il link «Annulla l'iscrizione» dell'ultima email che hai ricevuto, oppure scrivici dalla pagina Assistenza.</p>
            <Button asChild variant="outline" className="mt-6 w-full min-h-11 rounded-full">
              <Link to="/support">Assistenza</Link>
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
