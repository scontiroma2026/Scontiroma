import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// «Rimanda l'email» di conferma. Se l'indirizzo è già noto (appena iscritto, o dal login) basta il pulsante;
// altrimenti (link scaduto aperto da un altro telefono) lo si scrive. La risposta è sempre la stessa:
// il server non dice se l'indirizzo esiste.
export default function RimandaConferma({ email: emailNoto = "", testid = "rimanda" }) {
  const [email, setEmail] = useState(emailNoto);
  const [stato, setStato] = useState(null); // null | "invio" | {fatto} | {errore}
  const noto = Boolean(emailNoto);

  const rimanda = async (e) => {
    e?.preventDefault();
    setStato("invio");
    try {
      const { data } = await api.post("/auth/resend-confirmation", { email: email.trim() });
      setStato({ fatto: data.message });
    } catch (err) {
      setStato({ errore: formatApiError(err) });
    }
  };

  return (
    <form onSubmit={rimanda} className="space-y-3" data-testid={`${testid}-form`}>
      {!noto && (
        <div>
          <Label className="text-foreground/80">La tua email</Label>
          <Input data-testid={`${testid}-email`} type="email" required autoComplete="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 min-h-11 bg-muted border-border text-foreground" />
        </div>
      )}
      <Button data-testid={`${testid}-btn`} type="submit" disabled={stato === "invio" || !email.trim()}
        className="w-full min-h-11 grad-fucsia-viola text-white rounded-full">
        {stato === "invio" ? "Invio…" : "Rimanda l'email"}
      </Button>
      {stato?.fatto && (
        <p data-testid={`${testid}-esito`} role="status" className="rounded-xl border border-border bg-muted p-3 text-sm text-foreground/80">
          {stato.fatto} Controlla anche lo spam.
        </p>
      )}
      {stato?.errore && (
        <p data-testid={`${testid}-errore`} role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-800">
          {stato.errore}
        </p>
      )}
    </form>
  );
}
