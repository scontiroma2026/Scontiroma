import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

// Lista d'attesa prima del lancio: solo email e consenso esplicito (casella NON preselezionata).
// Il campo «sito_web» è una trappola per i programmi automatici: fuori dallo schermo, non si compila.
// Non usa cookie né memoria del telefono. La fonte (?src=instagram|facebook|volantino|passaparola) è limitata dal server.
export default function ListaAttesaForm({ testid = "lista-attesa", titolo = "Avvisami quando parte" }) {
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [consenso, setConsenso] = useState(false);
  const [trappola, setTrappola] = useState("");
  const [stato, setStato] = useState(null); // null | "invio" | { fatto } | { errore }

  const invia = async (e) => {
    e.preventDefault();
    if (!consenso) {
      setStato({ errore: "Per iscriverti spunta la casella del consenso." });
      return;
    }
    setStato("invio");
    try {
      const { data } = await api.post("/prelaunch/waitlist", {
        email: email.trim(),
        consenso: true,
        src: params.get("src") || params.get("fonte") || "",
        sito_web: trappola,
      });
      setStato({ fatto: data.message });
    } catch (err) {
      setStato({ errore: formatApiError(err) });
    }
  };

  if (stato?.fatto) {
    return (
      <div data-testid={`${testid}-grazie`} role="status" className="rounded-2xl border border-border bg-muted p-6 text-foreground">
        <CheckCircle2 size={32} className="text-fucsia" aria-hidden="true" />
        <p className="mt-3 font-serif text-2xl">Quasi fatto!</p>
        <p className="mt-2 text-foreground/80">{stato.fatto}</p>
      </div>
    );
  }

  return (
    <form onSubmit={invia} noValidate data-testid={`${testid}-form`} className="relative space-y-4 text-left">
      <h2 className="font-serif text-2xl text-foreground">{titolo}</h2>
      <div>
        <Label htmlFor={`${testid}-email`} className="text-foreground">La tua email</Label>
        <Input id={`${testid}-email`} data-testid={`${testid}-email`} type="email" required autoComplete="email"
          inputMode="email" placeholder="nome@esempio.it" value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 min-h-11 border-input bg-white text-foreground" />
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label>Il tuo sito web
          <input type="text" name="sito_web" tabIndex={-1} autoComplete="off" value={trappola}
            onChange={(e) => setTrappola(e.target.value)} data-testid={`${testid}-trappola`} />
        </label>
      </div>
      <label htmlFor={`${testid}-consenso`} className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-foreground">
        <input id={`${testid}-consenso`} data-testid={`${testid}-consenso`} type="checkbox" checked={consenso}
          onChange={(e) => setConsenso(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-fucsia" />
        <span>Voglio ricevere un'email quando Sconti Roma è online</span>
      </label>
      <p className="text-sm text-foreground/80">
        Useremo la tua email solo per questo avviso e puoi annullare quando vuoi. Leggi la{" "}
        <Link to="/privacy" data-testid={`${testid}-privacy`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
          Privacy
        </Link>.
      </p>
      {stato?.errore && (
        <p data-testid={`${testid}-errore`} role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-800">
          {stato.errore}
        </p>
      )}
      <Button type="submit" data-testid={`${testid}-invia`} disabled={stato === "invio"}
        className="min-h-11 w-full rounded-full px-8 grad-fucsia-viola text-white sm:w-auto">
        {stato === "invio" ? "Invio…" : "Avvisami"}
      </Button>
    </form>
  );
}
