import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const MOTIVO_MIN = 10;

/**
 * Finestra «Rifiuta offerta»: il motivo è obbligatorio (almeno 10 caratteri) perché il commerciante
 * lo riceve per email e in archivio. Il pulsante resta spento finché il motivo non è valido.
 * `onConferma(motivo)` può lanciare: l'errore del server resta visibile sotto il campo.
 */
export default function RifiutoOffertaDialog({ aperta, titolo, onChiudi, onConferma }) {
  const [motivo, setMotivo] = useState("");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);

  useEffect(() => {
    if (aperta) { setMotivo(""); setErrore(""); setInvio(false); }
  }, [aperta]);

  const lunghezza = motivo.trim().length;
  const valido = lunghezza >= MOTIVO_MIN;

  const conferma = async () => {
    if (!valido || invio) return;
    setInvio(true);
    setErrore("");
    try {
      await onConferma(motivo.trim());
    } catch (err) {
      setErrore(err?.message || "Rifiuto non riuscito, riprova.");
      setInvio(false);
    }
  };

  return (
    <Dialog open={aperta} onOpenChange={(o) => { if (!o && !invio) onChiudi(); }}>
      <DialogContent data-testid="rifiuto-dialog" className="max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Rifiutare l'offerta?</DialogTitle>
          <DialogDescription>
            {titolo ? `«${titolo}». ` : ""}Il commerciante riceve il motivo per email e potrà correggere l'offerta e reinviarla.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="rifiuto-motivo" className="text-sm font-semibold">
            Motivo del rifiuto <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only"> (obbligatorio)</span>
          </label>
          <Textarea
            id="rifiuto-motivo"
            data-testid="rifiuto-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            aria-required="true"
            aria-invalid={lunghezza > 0 && !valido}
            rows={4}
            maxLength={500}
            placeholder="Es. Il prezzo pieno indicato non corrisponde a quello praticato."
            className="mt-1"
          />
          <p
            data-testid="rifiuto-aiuto"
            className={`mt-1 text-xs ${lunghezza > 0 && !valido ? "text-destructive" : "text-muted-foreground"}`}
            role={lunghezza > 0 && !valido ? "alert" : undefined}
          >
            {valido
              ? "Il motivo è abbastanza chiaro."
              : `Il motivo è obbligatorio: scrivi almeno ${MOTIVO_MIN} caratteri (ne mancano ${MOTIVO_MIN - lunghezza}).`}
          </p>
          {errore && <p data-testid="rifiuto-errore" role="alert" className="mt-2 text-sm text-destructive">{errore}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onChiudi} disabled={invio} data-testid="rifiuto-annulla" className="rounded-full">
            Annulla
          </Button>
          <Button
            type="button"
            onClick={conferma}
            disabled={!valido || invio}
            data-testid="rifiuto-conferma"
            className="rounded-full bg-destructive text-white hover:bg-destructive/90"
          >
            Rifiuta offerta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
