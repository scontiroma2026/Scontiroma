import { useEffect, useRef, useState } from "react";
import { Camera, Sparkles, Loader2, X, RefreshCw } from "lucide-react";

const MAX_DIM = 1200;
const JPEG_QUALITY = 0.85;

// Soft-sharpen convolution kernel (compensates hand micro-shake)
const SHARPEN_KERNEL = [
  0, -0.6, 0,
  -0.6, 3.4, -0.6,
  0, -0.6, 0,
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function applyConvolution(src, kernel) {
  const { width, height, data } = src;
  const out = new ImageData(width, height);
  const k = kernel;
  const kSize = 3;
  const half = 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - half));
          const py = Math.min(height - 1, Math.max(0, y + ky - half));
          const idx = (py * width + px) * 4;
          const w = k[ky * kSize + kx];
          r += data[idx]     * w;
          g += data[idx + 1] * w;
          b += data[idx + 2] * w;
        }
      }
      const dst = (y * width + x) * 4;
      out.data[dst]     = Math.min(255, Math.max(0, r));
      out.data[dst + 1] = Math.min(255, Math.max(0, g));
      out.data[dst + 2] = Math.min(255, Math.max(0, b));
      out.data[dst + 3] = data[dst + 3];
    }
  }
  return out;
}

async function enhance(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // 1. Brightness +15%, Contrast +10%, Saturation +15% via Canvas filter
  ctx.filter = "brightness(1.15) contrast(1.10) saturate(1.15)";
  ctx.drawImage(img, 0, 0, w, h);

  // 2. Sharpening via convolution
  ctx.filter = "none";
  const imgData = ctx.getImageData(0, 0, w, h);
  const sharpened = applyConvolution(imgData, SHARPEN_KERNEL);
  ctx.putImageData(sharpened, 0, 0);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function PhotoEnhancer({ value, onChange, testIdPrefix = "photo" }) {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [showBadge, setShowBadge] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const lastFileRef = useRef(null);

  // Sync preview when parent loads persisted image_url async
  useEffect(() => {
    if (value && value !== preview) setPreview(value);
    if (!value && preview && !lastFileRef.current) setPreview(null);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const process = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Formato non supportato. Usa JPG o PNG.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Immagine troppo grande (max 15MB)");
      return;
    }
    setError(null);
    setProcessing(true);
    lastFileRef.current = file;
    try {
      const dataUrl = await enhance(file);
      setPreview(dataUrl);
      setShowBadge(true);
      onChange && onChange(dataUrl);
      setTimeout(() => setShowBadge(false), 4000);
    } catch (e) {
      console.warn("[photo-enhancer] enhance failed:", e?.message || e);
      setError("Errore durante l'ottimizzazione. Riprova con un'altra foto.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) process(file);
  };

  const reprocess = () => {
    if (lastFileRef.current) process(lastFileRef.current);
  };

  const clear = () => {
    setPreview(null);
    setShowBadge(false);
    onChange && onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        data-testid={`${testIdPrefix}-input`}
      />

      {!preview && (
        <button
          type="button"
          data-testid={`${testIdPrefix}-upload-btn`}
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-black/40 p-8 text-center transition hover:border-fucsia hover:bg-fucsia/5"
        >
          {processing ? (
            <>
              <Loader2 size={32} className="mx-auto animate-spin text-fucsia" />
              <div className="mt-3 text-white/70 text-sm">Ottimizzazione in corso…</div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl grad-fucsia-viola text-white">
                <Camera size={24} />
              </div>
              <div className="mt-3 font-serif text-lg text-white">Carica una foto</div>
              <div className="text-xs text-white/50">JPG o PNG · L'app la ottimizzerà automaticamente</div>
            </>
          )}
        </button>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border-2 border-fucsia glow-fucsia" data-testid={`${testIdPrefix}-preview`}>
            {processing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                <Loader2 size={40} className="animate-spin text-fucsia" />
              </div>
            )}
            <img src={preview} alt="Preview ottimizzata" className="block w-full h-auto max-h-[400px] object-contain bg-black" />
            {showBadge && (
              <div
                data-testid={`${testIdPrefix}-badge`}
                className="absolute inset-x-0 top-0 grad-fucsia-viola text-white px-4 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg"
                style={{animation: "slideDown 0.4s ease-out"}}
              >
                <Sparkles size={16} className="animate-pulse" />
                <span>Foto ottimizzata automaticamente per la homepage!</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 rounded-full bg-black/70 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-widest text-white/80">
              +15% luce · +10% contrasto · +15% colori · nitidezza
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              data-testid={`${testIdPrefix}-change-btn`}
              onClick={() => inputRef.current?.click()}
              className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              <Camera size={14} /> Cambia foto
            </button>
            {lastFileRef.current && (
              <button
                type="button"
                data-testid={`${testIdPrefix}-reprocess-btn`}
                onClick={reprocess}
                disabled={processing}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Ri-ottimizza
              </button>
            )}
            <button
              type="button"
              data-testid={`${testIdPrefix}-clear-btn`}
              onClick={clear}
              className="rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive hover:bg-destructive/20 transition"
              aria-label="Rimuovi foto"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" data-testid={`${testIdPrefix}-error`}>
          {error}
        </div>
      )}

      <style>{`@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
