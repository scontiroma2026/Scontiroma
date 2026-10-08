import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Sparkles, X } from "lucide-react";

/**
 * Finestra «Originale / Migliorata con IA».
 * stato: { fase: "attesa" | "confronto" | "errore", originale, migliorata, errore }
 * Chiudere la finestra (X, ESC, tocco fuori) = tenere l'originale.
 */
export default function PhotoCompareDialog({ stato, onUsa, onTieni }) {
  if (!stato) return null;
  const { fase, originale, migliorata, errore } = stato;
  const titolo = fase === "confronto" ? "Confronta le due foto" : fase === "errore" ? "Non è stato possibile migliorare la foto" : "Sto migliorando la foto…";

  return (
    <Dialog.Root open onOpenChange={(aperto) => { if (!aperto) onTieni(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-ac-ink/60" />
        <Dialog.Content
          data-testid="photo-compare-dialog"
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[9999] max-h-[94vh] overflow-y-auto rounded-t-3xl bg-white p-4 text-ac-ink shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,640px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <Dialog.Title className="font-serif text-xl font-bold leading-tight text-ac-ink">{titolo}</Dialog.Title>
            <Dialog.Close
              data-testid="photo-compare-close"
              aria-label="Chiudi e tieni l'originale"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ac-line bg-white text-ac-ink hover:bg-ac-tint"
            >
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </div>

          {fase === "attesa" && (
            <div data-testid="photo-compare-loading" role="status" className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-ac-line bg-ac-tint">
                <img src={originale} alt="Foto originale" className="block max-h-[45vh] w-full object-contain opacity-60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={36} className="animate-spin text-ac-rosa" aria-hidden="true" />
                </div>
              </div>
              <p className="text-sm font-semibold text-ac-soft">
                Sto migliorando la foto… Può volerci anche un minuto: puoi aspettare qui. La tua foto non cambia finché non scegli.
              </p>
              <button
                type="button"
                data-testid="photo-compare-cancel"
                onClick={onTieni}
                className="min-h-11 w-full rounded-full border-2 border-ac-soft bg-white px-4 py-2 text-sm font-extrabold text-ac-ink hover:bg-ac-tint"
              >
                Annulla
              </button>
            </div>
          )}

          {fase === "errore" && (
            <div className="space-y-4">
              <div data-testid="photo-compare-error" role="alert" className="rounded-xl border border-ac-rosso/40 bg-ac-rossoBg p-3 text-sm font-semibold text-ac-rosso">
                {errore}
              </div>
              <p className="text-sm font-semibold text-ac-soft">La foto è rimasta com'è.</p>
              <button
                type="button"
                data-testid="photo-compare-keep-original"
                onClick={onTieni}
                className="min-h-11 w-full rounded-full border-2 border-ac-soft bg-white px-4 py-2 text-sm font-extrabold text-ac-ink hover:bg-ac-tint"
              >
                Chiudi
              </button>
            </div>
          )}

          {fase === "confronto" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <figure className="space-y-1.5">
                  <figcaption className="text-sm font-extrabold text-ac-ink">Originale</figcaption>
                  <div className="aspect-square overflow-hidden rounded-xl border border-ac-line bg-ac-tint">
                    <img data-testid="photo-compare-original" src={originale} alt="Foto originale" className="h-full w-full object-cover" />
                  </div>
                </figure>
                <figure className="space-y-1.5">
                  <figcaption className="flex items-center gap-1 text-sm font-extrabold text-ac-rosa">
                    <Sparkles size={14} aria-hidden="true" /> Migliorata con IA
                  </figcaption>
                  <div className="aspect-square overflow-hidden rounded-xl border-2 border-ac-rosa bg-ac-tint">
                    <img data-testid="photo-compare-enhanced" src={migliorata} alt="Foto migliorata con IA" className="h-full w-full object-cover" />
                  </div>
                </figure>
              </div>
              <p className="text-sm font-semibold text-ac-soft">
                Scegli quale tenere. Se usi la migliorata, potrai sempre tornare all'originale.
              </p>
              <div className="grid gap-2">
                <button
                  type="button"
                  data-testid="photo-compare-use-enhanced"
                  onClick={onUsa}
                  className="ac-grad min-h-12 w-full rounded-full px-4 py-2 text-base font-extrabold text-white hover:brightness-105"
                >
                  Usa la migliorata
                </button>
                <button
                  type="button"
                  data-testid="photo-compare-keep-original"
                  onClick={onTieni}
                  className="min-h-12 w-full rounded-full border-2 border-ac-soft bg-white px-4 py-2 text-base font-extrabold text-ac-ink hover:bg-ac-tint"
                >
                  Tieni l'originale
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
