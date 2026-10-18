import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Controllo foto di un'offerta in attesa: ogni foto si ingrandisce con un tocco e ha «Approva» / «Scarta».
 * «Scarta» chiede il motivo (almeno 10 caratteri, lo legge il commerciante nell'email di pubblicazione).
 * Il genitore riceve in `onChange` l'elenco [{url, motivo}] delle foto scartate da mandare all'approvazione.
 */
export default function FotoControllo({ id, urls, onChange }) {
  const [scelte, setScelte] = useState({});
  const [ingrandita, setIngrandita] = useState(null);

  useEffect(() => {
    if (!onChange) return;
    onChange(Object.entries(scelte).filter(([, v]) => v && v.scartata).map(([url, v]) => ({ url, motivo: v.scartata })));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notifica solo quando cambiano le scelte
  }, [scelte]);

  const imposta = (url, valore) =>
    setScelte((s) => {
      const nuove = { ...s };
      if (valore === null) delete nuove[url]; else nuove[url] = valore;
      return nuove;
    });
  const scarta = (url) => {
    const motivo = (window.prompt("Perché scarti questa foto? (la legge il commerciante nell'email di pubblicazione, almeno 10 caratteri)", "") || "").trim();
    if (!motivo) return;
    if (motivo.length < 10) { toast.error("Serve un motivo di almeno 10 caratteri"); return; }
    imposta(url, { scartata: motivo });
  };

  if (!urls || urls.length === 0) return null;
  return (
    <div className="mt-3" data-testid={`foto-controllo-${id}`}>
      <div className="text-xs font-semibold text-muted-foreground">
        Foto dell'offerta ({urls.length}): tocca per ingrandire, poi approva o scarta ogni foto
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, i) => {
          const scelta = scelte[url];
          const scartata = scelta && scelta.scartata;
          const ok = scelta && scelta.ok;
          return (
            <div key={url} data-testid={`foto-${id}-${i}`} className="flex flex-col gap-1.5">
              <button type="button" onClick={() => setIngrandita(url)} aria-label={`Ingrandisci la foto ${i + 1}`}
                className={`overflow-hidden rounded-lg border-2 ${scartata ? "border-destructive/60 opacity-50" : ok ? "border-green-600" : "border-border"}`}>
                <img src={url} alt={`Foto ${i + 1}`} className="aspect-video w-full object-cover" loading="lazy" />
              </button>
              {scartata ? (
                <>
                  <p className="text-xs text-destructive" data-testid={`foto-scartata-${id}-${i}`}>Scartata: {scelta.scartata}</p>
                  <Button type="button" size="sm" variant="outline" className="min-h-11 rounded-full" onClick={() => imposta(url, null)}>Ripristina</Button>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Button type="button" size="sm" data-testid={`foto-approva-${id}-${i}`} variant={ok ? "default" : "outline"}
                    className="min-h-11 w-full rounded-full" onClick={() => imposta(url, { ok: true })}>
                    <Check size={14} className="mr-1" /> Approva
                  </Button>
                  <Button type="button" size="sm" data-testid={`foto-scarta-${id}-${i}`} variant="outline"
                    className="min-h-11 w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => scarta(url)}>
                    <X size={14} className="mr-1" /> Scarta
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Dialog open={!!ingrandita} onOpenChange={(o) => { if (!o) setIngrandita(null); }}>
        <DialogContent data-testid="foto-ingrandita" className="max-w-3xl bg-white p-3 text-ac-ink">
          <DialogHeader>
            <DialogTitle className="sr-only">Foto ingrandita</DialogTitle>
            <DialogDescription className="sr-only">Controlla la foto prima di approvarla o scartarla</DialogDescription>
          </DialogHeader>
          {ingrandita && <img src={ingrandita} alt="Foto ingrandita" className="max-h-[80vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
