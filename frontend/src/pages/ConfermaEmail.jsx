import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import RimandaConferma from "@/components/RimandaConferma";

// Pagina aperta dal link dell'email di conferma (/conferma-email?token=…).
// La conferma parte con POST da qui, non con un GET sul link: gli antivirus della posta aprono i link e la consumerebbero.
export default function ConfermaEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [stato, setStato] = useState(token ? "attesa" : "errore"); // attesa | ok | errore
  const [scaduto, setScaduto] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let annullato = false;
    api.post("/auth/confirm-email", { token })
      .then(() => { if (!annullato) setStato("ok"); })
      .catch((err) => {
        if (annullato) return;
        setScaduto(err?.response?.data?.detail?.code === "link_scaduto");
        setStato("errore");
      });
    return () => { annullato = true; };
  }, [token]);

  return (
    <main data-testid="conferma-email-page" className="mx-auto max-w-md px-6 py-16">
      <Card className="border-border bg-muted p-8">
        {stato === "attesa" && (
          <div className="flex items-center gap-3 text-foreground" role="status">
            <Loader2 className="animate-spin" size={24} /> Sto confermando il tuo account…
          </div>
        )}

        {stato === "ok" && (
          <div data-testid="conferma-ok">
            <CheckCircle2 size={40} className="text-fucsia" aria-hidden="true" />
            <h1 className="mt-3 font-serif text-4xl text-foreground">Iscrizione completata!</h1>
            <p className="mt-2 text-foreground/80">Ora puoi accedere.</p>
            <Button asChild data-testid="conferma-accedi" className="mt-6 w-full min-h-11 grad-fucsia-viola text-white rounded-full">
              <Link to="/login">Accedi</Link>
            </Button>
          </div>
        )}

        {stato === "errore" && (
          <div data-testid="conferma-errore">
            <AlertCircle size={40} className="text-fucsia" aria-hidden="true" />
            <h1 className="mt-3 font-serif text-3xl text-foreground">
              {scaduto ? "Il link è scaduto" : "Link non valido"}
            </h1>
            <p className="mt-2 text-foreground/80">
              {scaduto
                ? "Il link di conferma vale 48 ore. Se vuoi, te ne mandiamo uno nuovo."
                : "Questo link non è valido o è già stato usato. Se hai già confermato, puoi accedere; altrimenti te ne mandiamo uno nuovo."}
            </p>
            <div className="mt-6"><RimandaConferma testid="conferma-rimanda" /></div>
            <Button asChild variant="outline" className="mt-3 w-full min-h-11 rounded-full">
              <Link to="/login">Vai al login</Link>
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
