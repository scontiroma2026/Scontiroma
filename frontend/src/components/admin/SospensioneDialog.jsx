import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MOTIVO_MIN } from "@/components/admin/RifiutoOffertaDialog";

/**
 * Finestra «Sospendi negozio»: il motivo è obbligatorio (almeno 10 caratteri) perché il commerciante
 * lo riceve per email insieme a come contestare (info@scontiroma.it, riesame entro 10 giorni lavorativi).
 * `onConferma(motivo)` può lanciare: l'errore del server resta visibile sotto il campo.
 */
export default function SospensioneDialog({ aperta, negozio, onChiudi, onConferma }) {
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
      setErrore(err?.message || "Sospensione non riuscita, riprova.");
      setInvio(false);
    }
  };

  return (
    <Dialog open={aperta} onOpenChange={(o) => { if (!o && !invio) onChiudi(); }}>
      <DialogContent data-testid="sospensione-dialog" className="max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Sospendere {negozio || "il negozio"}?</DialogTitle>
          <DialogDescription>
            La sua offerta sparisce subito dall'app e i clienti non possono più usarla. Il commerciante riceve
            un'email con il motivo e con come contestare (riesame entro 10 giorni lavorativi). Puoi riattivarlo quando vuoi.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="sospensione-motivo" className="text-sm font-semibold">
            Motivo della sospensione <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only"> (obbligatorio)</span>
          </label>
          <Textarea
            id="sospensione-motivo"
            data-testid="sospensione-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            aria-required="true"
            aria-invalid={lunghezza > 0 && !valido}
            rows={4}
            maxLength={1000}
            placeholder="Es. Lo sconto pubblicato non viene applicato in negozio."
            className="mt-1"
          />
          <p
            data-testid="sospensione-aiuto"
            className={`mt-1 text-xs ${lunghezza > 0 && !valido ? "text-destructive" : "text-muted-foreground"}`}
            role={lunghezza > 0 && !valido ? "alert" : undefined}
          >
            {valido
              ? "Il motivo è abbastanza chiaro."
              : `Il motivo è obbligatorio: scrivi almeno ${MOTIVO_MIN} caratteri (ne mancano ${MOTIVO_MIN - lunghezza}).`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Non scrivere nomi, email o telefoni di clienti o di altre persone: il testo arriva al commerciante.</p>
          {errore && <p data-testid="sospensione-errore" role="alert" className="mt-2 text-sm text-destructive">{errore}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onChiudi} disabled={invio} data-testid="sospensione-annulla" className="rounded-full">
            Annulla
          </Button>
          <Button
            type="button"
            onClick={conferma}
            disabled={!valido || invio}
            data-testid="sospensione-conferma"
            className="rounded-full bg-destructive text-white hover:bg-destructive/90"
          >
            Sospendi negozio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
