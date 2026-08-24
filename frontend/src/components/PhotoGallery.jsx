import { useState, useEffect } from "react";
import { X, ChevronUp, ChevronDown, Plus, Star, ImagePlus, Sparkles, Loader2, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DefaultImagePicker from "@/components/DefaultImagePicker";
import PhotoEnhancer from "@/components/PhotoEnhancer";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";

/**
 * Galleria foto per il commerciante — max 8 immagini per offerta.
 * value: array di URL, onChange(newArray)
 * La PRIMA foto della galleria è la copertina (thumbnail nelle liste).
 */
export default function PhotoGallery({ value = [], onChange, max = 8, disabled = false, category = "" }) {
  const photos = Array.isArray(value) ? value : [];
  const [staged, setStaged] = useState("");
  const [enhancingIdx, setEnhancingIdx] = useState(-1);
  const [lightboxIdx, setLightboxIdx] = useState(-1); // -1 = chiuso
  const canAdd = photos.length < max && !disabled;

  const enhanceAt = async (i) => {
    if (disabled || enhancingIdx !== -1) return;
    setEnhancingIdx(i);
    try {
      const { data } = await api.post("/ai/enhance-image", {
        image_url: photos[i],
        category: category || "",
      });
      const enhanced = data.enhanced_image_url;
      if (!enhanced) throw new Error("Nessuna immagine restituita");
      const next = [...photos];
      next[i] = enhanced;
      onChange(next);
      toast.success("Foto ottimizzata con AI ✨");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setEnhancingIdx(-1);
    }
  };

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
              <button
                type="button"
                data-testid={`photo-open-lightbox-${i}`}
                onClick={() => setLightboxIdx(i)}
                className="absolute inset-0 z-0 group/img cursor-zoom-in"
                title="Clicca per ingrandire"
              >
                <img
                  src={url}
                  alt={`foto ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition flex items-center justify-center opacity-0 group-hover/img:opacity-100 pointer-events-none">
                  <div className="rounded-full bg-black/70 backdrop-blur px-3 py-1.5 flex items-center gap-1.5 text-white text-xs font-semibold">
                    <ZoomIn size={14} /> Ingrandisci
                  </div>
                </div>
              </button>
              {/* Badge copertina */}
              {i === 0 && (
                <div className="absolute top-1 left-1 z-20 flex items-center gap-1 rounded-full bg-gold/90 text-black px-2 py-0.5 text-[10px] font-bold pointer-events-none">
                  <Star size={10} fill="currentColor" /> Copertina
                </div>
              )}
              {/* Numero */}
              <div className="absolute top-1 right-1 z-20 rounded-full bg-black/70 text-white text-[10px] font-mono w-5 h-5 flex items-center justify-center pointer-events-none">
                {i + 1}
              </div>
              {/* Overlay controlli */}
              {!disabled && (
                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-1 opacity-0 group-hover:opacity-100 transition">
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
              {/* Pulsante "Ottimizza con AI" — sempre visibile in alto */}
              {!disabled && (
                <button
                  type="button"
                  data-testid={`photo-ai-enhance-${i}`}
                  onClick={() => enhanceAt(i)}
                  disabled={enhancingIdx !== -1}
                  className={`absolute top-8 left-1 right-1 z-20 flex items-center justify-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md transition ${
                    enhancingIdx === i
                      ? "grad-fucsia-viola text-white"
                      : enhancingIdx !== -1
                      ? "bg-black/60 text-white/40 cursor-wait"
                      : "bg-black/75 text-white hover:grad-fucsia-viola border border-fucsia/50"
                  }`}
                  title="Ottimizza questa foto con l'intelligenza artificiale (Gemini Nano Banana)"
                >
                  {enhancingIdx === i ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Ottimizzo…
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-fucsia" /> Ottimizza con AI
                    </>
                  )}
                </button>
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

      {/* Lightbox — foto ingrandita full-screen con navigazione ← / → */}
      {lightboxIdx >= 0 && photos[lightboxIdx] && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIdx}
          onIndexChange={setLightboxIdx}
          onClose={() => setLightboxIdx(-1)}
        />
      )}
    </div>
  );
}

/**
 * PhotoLightbox — modale full-screen che mostra la foto ingrandita.
 * - Navigazione con ← / → o cliccando le frecce
 * - ESC per chiudere, click sull'overlay per chiudere
 * - Contatore "N di M" + badge Copertina se index=0
 * Utile per verificare la foto dopo l'ottimizzazione AI o dopo upload.
 */
function PhotoLightbox({ photos, index, onIndexChange, onClose }) {
  const canPrev = index > 0;
  const canNext = index < photos.length - 1;

  // Tastiera: ESC / ← / → + blocca lo scroll del body finché il modal è aperto
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      else if (e.key === "ArrowRight" && index < photos.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, photos.length, onIndexChange, onClose]);

  return (
    <div
      data-testid="photo-lightbox"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      {/* Chiudi (in alto a destra) */}
      <button
        type="button"
        data-testid="photo-lightbox-close"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        title="Chiudi (ESC)"
      >
        <X size={22} />
      </button>

      {/* Contatore + copertina */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-white text-sm font-mono">
          {index + 1} / {photos.length}
        </div>
        {index === 0 && (
          <div className="rounded-full bg-gold/90 text-black px-3 py-1.5 text-xs font-bold flex items-center gap-1">
            <Star size={12} fill="currentColor" /> Copertina
          </div>
        )}
      </div>

      {/* Freccia sinistra */}
      {canPrev && (
        <button
          type="button"
          data-testid="photo-lightbox-prev"
          onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
          className="absolute left-4 sm:left-8 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition"
          title="Precedente (←)"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Foto ingrandita */}
      <img
        src={photos[index]}
        alt={`foto ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full sm:max-w-[85vw] rounded-2xl shadow-2xl object-contain animate-in fade-in-0 zoom-in-95"
      />

      {/* Freccia destra */}
      {canNext && (
        <button
          type="button"
          data-testid="photo-lightbox-next"
          onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
          className="absolute right-4 sm:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition"
          title="Successiva (→)"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Thumbstrip in basso su desktop */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex gap-1.5 rounded-full bg-white/10 backdrop-blur px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((_, i) => (
            <button
              key={`lb-dot-${i}`}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-fucsia" : "w-2 bg-white/40 hover:bg-white/70"}`}
              aria-label={`Vai a foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
