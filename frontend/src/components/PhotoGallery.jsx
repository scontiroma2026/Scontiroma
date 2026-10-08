import { useState, useEffect, useRef } from "react";
import { X, ChevronUp, ChevronDown, Plus, Star, ImagePlus, Sparkles, Loader2, ZoomIn, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DefaultImagePicker from "@/components/DefaultImagePicker";
import PhotoEnhancer from "@/components/PhotoEnhancer";
import PhotoCompareDialog from "@/components/PhotoCompareDialog";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";

/**
 * Galleria foto per il commerciante — max 8 immagini per offerta.
 * value: array di URL, onChange(newArray)
 * La PRIMA foto della galleria è la copertina (thumbnail nelle liste).
 */
export default function PhotoGallery({ value = [], onChange, max = 8, disabled = false, category = "" }) {
  const photos = Array.isArray(value) ? value : [];
  const [enhancingIdx, setEnhancingIdx] = useState(-1);
  const [lightboxIdx, setLightboxIdx] = useState(-1); // -1 = chiuso
  const [confronto, setConfronto] = useState(null); // finestra «Originale / Migliorata»
  // Foto originali tenute in memoria finché la pagina è aperta: { urlMigliorata: urlOriginale }
  const [originali, setOriginali] = useState({});
  const [slotKey, setSlotKey] = useState(0); // riparte il selettore dopo ogni foto aggiunta
  const tokenRef = useRef(0);
  const canAdd = photos.length < max && !disabled;

  const messaggioIA = (e) => {
    const st = e?.response?.status;
    if (st === 503) return "L'ottimizzazione con IA non è attiva in questo momento. La foto resta com'è.";
    if (st === 413) return "Foto troppo grande per l'IA (massimo 8 MB). La foto resta com'è.";
    if (st === 502) return "L'IA non è riuscita a migliorare questa foto. Riprova tra poco o con un'altra foto. La foto resta com'è.";
    if (!e?.response) return "Connessione interrotta mentre miglioravo la foto. La foto resta com'è.";
    return `${formatApiError(e)} La foto resta com'è.`;
  };

  const enhanceAt = async (i) => {
    if (disabled || enhancingIdx !== -1) return;
    const originale = photos[i];
    const mio = ++tokenRef.current;
    setEnhancingIdx(i);
    setConfronto({ fase: "attesa", originale });
    try {
      const { data } = await api.post(
        "/ai/enhance-image",
        { image_url: originale, category: category || "" },
        { timeout: 120000 },
      );
      if (mio !== tokenRef.current) return; // annullato: si tiene l'originale
      const migliorata = data?.enhanced_image_url;
      if (!migliorata) throw new Error("Nessuna immagine restituita");
      setConfronto({ fase: "confronto", originale, migliorata });
    } catch (e) {
      if (mio !== tokenRef.current) return;
      setConfronto({ fase: "errore", originale, errore: messaggioIA(e) });
    }
  };

  // Chiudere / annullare / «Tieni l'originale»: la foto non cambia.
  const tieniOriginale = () => {
    tokenRef.current += 1;
    setConfronto(null);
    setEnhancingIdx(-1);
  };

  const usaMigliorata = () => {
    if (!confronto || confronto.fase !== "confronto") return;
    const { originale, migliorata } = confronto;
    const i = photos.indexOf(originale);
    tokenRef.current += 1;
    setConfronto(null);
    setEnhancingIdx(-1);
    if (i === -1) return;
    const next = [...photos];
    next[i] = migliorata;
    setOriginali((o) => ({ ...o, [migliorata]: originale }));
    onChange(next);
    toast.success("Foto ottimizzata con IA");
  };

  const ripristinaAt = (i) => {
    const originale = originali[photos[i]];
    if (disabled || !originale) return;
    const next = [...photos];
    next[i] = originale;
    setOriginali((o) => {
      const { [photos[i]]: _tolta, ...resto } = o;
      return resto;
    });
    onChange(next);
    toast.success("Foto originale ripristinata");
  };

  // La foto scelta o scattata entra SUBITO nella galleria: nessun passaggio di conferma da dimenticare.
  const addPhoto = (url) => {
    if (!url) return;
    if (photos.length >= max) {
      toast.error(`Hai già ${max} foto: toglierne una per aggiungerne un'altra.`);
      return;
    }
    if (photos.includes(url)) {
      toast.info("Questa foto è già nella galleria.");
    } else {
      onChange([...photos, url]);
      toast.success("Foto aggiunta alla galleria");
    }
    setSlotKey((k) => k + 1);
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
        <div className="text-sm font-semibold text-ac-soft">
          <ImagePlus size={14} className="mr-1 inline text-ac-rosa" aria-hidden="true" />
          <strong className="text-ac-ink">{photos.length}</strong> / {max} foto
          {photos.length > 0 && (
            <span className="ml-2 text-xs font-bold text-ac-viola">
              (la 1ª è la copertina)
            </span>
          )}
        </div>
        {photos.length >= max && (
          <span className="text-xs font-bold text-ac-rosso">Limite raggiunto</span>
        )}
      </div>

      {/* Griglia tiles */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div key={`${url.slice(-40)}-${i}`} className="space-y-1.5">
            <div
              data-testid={`photo-tile-${i}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-ac-line bg-ac-tint"
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
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-muted transition flex items-center justify-center opacity-0 group-hover/img:opacity-100 pointer-events-none">
                  <div className="rounded-full bg-black/70 backdrop-blur px-3 py-1.5 flex items-center gap-1.5 text-white text-xs font-semibold">
                    <ZoomIn size={14} /> Ingrandisci
                  </div>
                </div>
              </button>
              {/* Badge copertina */}
              {i === 0 && (
                <div className="absolute top-1 left-1 z-20 flex items-center gap-1 rounded-full bg-muted text-ac-ink px-2 py-0.5 text-[11px] font-extrabold shadow pointer-events-none">
                  <Star size={10} fill="currentColor" /> Copertina
                </div>
              )}
              {/* Numero */}
              <div className="absolute top-1 right-1 z-20 rounded-full bg-black/70 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center pointer-events-none">
                {i + 1}
              </div>
              {/* Overlay controlli */}
              {!disabled && (
                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-1 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      data-testid={`photo-move-up-${i}`}
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className={`flex h-11 w-11 items-center justify-center rounded-lg ${i === 0 ? "opacity-30 cursor-not-allowed" : "text-foreground hover:bg-secondary"}`}
                      title="Sposta prima"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      type="button"
                      data-testid={`photo-move-down-${i}`}
                      onClick={() => move(i, 1)}
                      disabled={i === photos.length - 1}
                      className={`flex h-11 w-11 items-center justify-center rounded-lg ${i === photos.length - 1 ? "opacity-30 cursor-not-allowed" : "text-foreground hover:bg-secondary"}`}
                      title="Sposta dopo"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <button
                    type="button"
                    data-testid={`photo-remove-${i}`}
                    onClick={() => removeAt(i)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-ac-rosso text-white hover:brightness-110"
                    title="Rimuovi"
                  >
                    <X size={18} />
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
                  className={`absolute top-8 left-1 right-1 z-20 flex min-h-11 items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider shadow-lg backdrop-blur-md transition ${
                    enhancingIdx === i
                      ? "ac-grad text-white"
                      : enhancingIdx !== -1
                      ? "bg-black/60 text-white/40 cursor-wait"
                      : "bg-black/80 text-white hover:ac-grad border border-white/40"
                  }`}
                  title="Migliora questa foto con l'intelligenza artificiale"
                >
                  {enhancingIdx === i ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Sto migliorando…
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} /> Migliora con IA
                    </>
                  )}
                </button>
              )}
            </div>
            {originali[url] && (
              <div className="space-y-1">
                <div data-testid={`photo-ai-badge-${i}`} className="flex items-center gap-1 text-xs font-extrabold text-ac-rosa">
                  <Sparkles size={12} aria-hidden="true" /> Foto ottimizzata con IA
                </div>
                {!disabled && (
                  <button
                    type="button"
                    data-testid={`photo-restore-${i}`}
                    onClick={() => ripristinaAt(i)}
                    className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border-2 border-ac-soft bg-white px-3 py-1.5 text-xs font-extrabold text-ac-ink hover:bg-ac-tint"
                  >
                    <Undo2 size={14} aria-hidden="true" /> Ripristina l'originale
                  </button>
                )}
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {/* Picker per aggiungere una nuova foto (visibile solo se sotto il max) */}
      {canAdd && (
        <div className="rounded-2xl border-2 border-dashed border-ac-campo bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5 text-[13px] font-extrabold text-ac-viola">
            <Plus size={14} aria-hidden="true" /> Aggiungi la {photos.length + 1}ª foto
          </div>

          <div className="space-y-3">
            <DefaultImagePicker
              selectedUrl=""
              onSelect={(url) => addPhoto(url)}
            />
            <PhotoEnhancer
              key={slotKey}
              value=""
              onChange={(url) => addPhoto(url)}
              testIdPrefix={`gallery-slot-${photos.length}`}
            />
          </div>
        </div>
      )}

      {photos.length === 0 && !canAdd && (
        <div className="rounded-2xl border-2 border-dashed border-ac-campo bg-ac-tint p-6 text-center text-sm font-semibold text-ac-soft">
          Nessuna foto caricata
        </div>
      )}

      <PhotoCompareDialog stato={confronto} onUsa={usaMigliorata} onTieni={tieniOriginale} />

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
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary transition"
        title="Chiudi (ESC)"
      >
        <X size={22} />
      </button>

      {/* Contatore + copertina */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="rounded-full bg-muted backdrop-blur px-3 py-1.5 text-foreground text-sm font-mono">
          {index + 1} / {photos.length}
        </div>
        {index === 0 && (
          <div className="rounded-full bg-gold text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1">
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
          className="absolute left-4 sm:left-8 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary hover:scale-110 transition"
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
          className="absolute right-4 sm:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary hover:scale-110 transition"
          title="Successiva (→)"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Thumbstrip in basso su desktop */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex gap-1.5 rounded-full bg-muted backdrop-blur px-3 py-2"
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
