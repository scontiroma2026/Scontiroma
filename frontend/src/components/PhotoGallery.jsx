import { useState } from "react";
import { X, ChevronUp, ChevronDown, Plus, Star, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DefaultImagePicker from "@/components/DefaultImagePicker";
import PhotoEnhancer from "@/components/PhotoEnhancer";

/**
 * Galleria foto per il commerciante — max 8 immagini per offerta.
 * value: array di URL, onChange(newArray)
 * La PRIMA foto della galleria è la copertina (thumbnail nelle liste).
 */
export default function PhotoGallery({ value = [], onChange, max = 8, disabled = false }) {
  const photos = Array.isArray(value) ? value : [];
  const [staged, setStaged] = useState("");
  const canAdd = photos.length < max && !disabled;

  const addStaged = () => {
    if (!staged) return;
    if (photos.includes(staged)) {
      // no duplicati
      setStaged("");
      return;
    }
    onChange([...photos, staged]);
    setStaged("");
  };

  const removeAt = (i) => {
    if (disabled) return;
    onChange(photos.filter((_, idx) => idx !== i));
  };

  const move = (i, dir) => {
    if (disabled) return;
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div data-testid="photo-gallery" className="space-y-4">
      {/* Header contatore */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">
          <ImagePlus size={12} className="inline mr-1 text-fucsia" />
          <strong className="text-white">{photos.length}</strong> / {max} foto
          {photos.length > 0 && (
            <span className="ml-2 text-[10px] text-gold">
              (la 1ª è la copertina)
            </span>
          )}
        </div>
        {photos.length >= max && (
          <span className="text-[10px] text-red-300">Limite raggiunto</span>
        )}
      </div>

      {/* Griglia tiles */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div
              key={`${url}-${i}`}
              data-testid={`photo-tile-${i}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 group"
            >
              <img
                src={url}
                alt={`foto ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Badge copertina */}
              {i === 0 && (
                <div className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-gold/90 text-black px-2 py-0.5 text-[10px] font-bold">
                  <Star size={10} fill="currentColor" /> Copertina
                </div>
              )}
              {/* Numero */}
              <div className="absolute top-1 right-1 rounded-full bg-black/70 text-white text-[10px] font-mono w-5 h-5 flex items-center justify-center">
                {i + 1}
              </div>
              {/* Overlay controlli */}
              {!disabled && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-1 opacity-0 group-hover:opacity-100 transition">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      data-testid={`photo-move-up-${i}`}
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className={`p-1 rounded ${i === 0 ? "opacity-30 cursor-not-allowed" : "text-white hover:bg-white/20"}`}
                      title="Sposta prima"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      data-testid={`photo-move-down-${i}`}
                      onClick={() => move(i, 1)}
                      disabled={i === photos.length - 1}
                      className={`p-1 rounded ${i === photos.length - 1 ? "opacity-30 cursor-not-allowed" : "text-white hover:bg-white/20"}`}
                      title="Sposta dopo"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    data-testid={`photo-remove-${i}`}
                    onClick={() => removeAt(i)}
                    className="p-1 rounded bg-red-500/80 text-white hover:bg-red-600"
                    title="Rimuovi"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Picker per aggiungere una nuova foto (visibile solo se sotto il max) */}
      {canAdd && (
        <div className="rounded-xl border border-dashed border-white/15 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-wider text-gold mb-3 flex items-center gap-1">
            <Plus size={12} /> Aggiungi la {photos.length + 1}ª foto
          </div>

          {/* Preview staged + conferma */}
          {staged ? (
            <div className="flex items-start gap-3 rounded-lg bg-black/50 border border-fucsia/30 p-3">
              <img
                src={staged}
                alt="anteprima"
                className="h-20 w-20 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/70 mb-2">Anteprima foto</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    data-testid="photo-add-confirm"
                    onClick={addStaged}
                    size="sm"
                    className="grad-fucsia-viola text-white hover:scale-105 transition"
                  >
                    <Plus size={14} className="mr-1" /> Aggiungi alla galleria
                  </Button>
                  <Button
                    type="button"
                    data-testid="photo-add-cancel"
                    onClick={() => setStaged("")}
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-transparent text-white hover:bg-white/5"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Libreria + Upload */}
              <div className="space-y-3">
                <DefaultImagePicker
                  selectedUrl=""
                  onSelect={(url) => setStaged(url)}
                />
                <PhotoEnhancer
                  value=""
                  onChange={(url) => setStaged(url)}
                  testIdPrefix={`gallery-slot-${photos.length}`}
                />
              </div>
            </>
          )}
        </div>
      )}

      {photos.length === 0 && !canAdd && (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-6 text-center text-xs text-white/50">
          Nessuna foto caricata
        </div>
      )}
    </div>
  );
}
