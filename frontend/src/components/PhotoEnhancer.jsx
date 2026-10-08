import { useEffect, useRef, useState } from "react";
import { Camera, Sparkles, Loader2, X, RefreshCw } from "lucide-react";
import { FotoError, leggiFoto, disegnaRidotta, canvasInJpeg } from "@/lib/foto";

// Soft-sharpen convolution kernel (compensates hand micro-shake)
const SHARPEN_KERNEL = [
  0, -0.6, 0,
  -0.6, 3.4, -0.6,
  0, -0.6, 0,
];

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

// Safari/iPhone non supporta ctx.filter: in quel caso luce, contrasto e colori si applicano a mano.
function ritoccoManuale(imgData) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] * 1.15, g = d[i + 1] * 1.15, b = d[i + 2] * 1.15;
    r = (r - 128) * 1.1 + 128; g = (g - 128) * 1.1 + 128; b = (b - 128) * 1.1 + 128;
    const grigio = 0.299 * r + 0.587 * g + 0.114 * b;
    d[i] = Math.min(255, Math.max(0, grigio + (r - grigio) * 1.15));
    d[i + 1] = Math.min(255, Math.max(0, grigio + (g - grigio) * 1.15));
    d[i + 2] = Math.min(255, Math.max(0, grigio + (b - grigio) * 1.15));
  }
}

// Legge la foto, la riduce a 1600 px di lato massimo, la ritocca e la restituisce in JPEG (qualità 0,85).
async function enhance(file) {
  const img = await leggiFoto(file);
  const { canvas, ctx, w, h } = disegnaRidotta(img);
  const haFiltri = typeof ctx.filter === "string";
  if (haFiltri) {
    // 1. Luce +15%, contrasto +10%, colori +15% con il filtro del canvas
    const bozza = document.createElement("canvas");
    bozza.width = w; bozza.height = h;
    const bctx = bozza.getContext("2d");
    bctx.filter = "brightness(1.15) contrast(1.10) saturate(1.15)";
    bctx.drawImage(canvas, 0, 0);
    ctx.drawImage(bozza, 0, 0);
  }
  let imgData = ctx.getImageData(0, 0, w, h);
  if (!haFiltri) ritoccoManuale(imgData);
  // 2. Nitidezza
  ctx.putImageData(applyConvolution(imgData, SHARPEN_KERNEL), 0, 0);
  return canvasInJpeg(canvas);
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
      setError(e instanceof FotoError ? e.message : "Non sono riuscito a preparare la foto. Riprova con un'altra foto.");
      if (inputRef.current) inputRef.current.value = ""; // così si può riscegliere la stessa foto
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
          className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-ac-campo bg-white p-8 text-center transition hover:border-ac-rosa hover:bg-ac-rosaSoft"
        >
          {processing ? (
            <>
              <Loader2 size={32} className="mx-auto animate-spin text-ac-rosa" />
              <div className="mt-3 text-sm font-semibold text-ac-soft">Preparo la foto…</div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ac-grad text-white">
                <Camera size={24} />
              </div>
              <div className="mt-3 font-serif text-lg font-bold text-ac-ink">Carica una foto</div>
              <div className="text-sm text-ac-soft">Scatta o scegli una foto · la riduciamo noi e la ottimizziamo</div>
            </>
          )}
        </button>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border-2 border-ac-rosa" data-testid={`${testIdPrefix}-preview`}>
            {processing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                <Loader2 size={40} className="animate-spin text-ac-rosa" />
              </div>
            )}
            <img src={preview} alt="Preview ottimizzata" className="block w-full h-auto max-h-[400px] object-contain bg-ac-tint" />
            {showBadge && (
              <div
                data-testid={`${testIdPrefix}-badge`}
                className="absolute inset-x-0 top-0 ac-grad text-white px-4 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg"
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
              className="flex-1 rounded-full min-h-11 border-2 border-ac-soft bg-white px-4 py-2 text-sm font-extrabold text-ac-ink hover:bg-ac-tint transition flex items-center justify-center gap-2"
            >
              <Camera size={14} /> Cambia foto
            </button>
            {lastFileRef.current && (
              <button
                type="button"
                data-testid={`${testIdPrefix}-reprocess-btn`}
                onClick={reprocess}
                disabled={processing}
                className="rounded-full min-h-11 border-2 border-ac-soft bg-white px-4 py-2 text-sm font-extrabold text-ac-ink hover:bg-ac-tint transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Ri-ottimizza
              </button>
            )}
            <button
              type="button"
              data-testid={`${testIdPrefix}-clear-btn`}
              onClick={clear}
              className="min-h-11 rounded-full border-2 border-ac-rosso px-4 py-2 text-sm font-extrabold text-ac-rosso hover:bg-ac-rossoBg transition"
              aria-label="Rimuovi foto"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-ac-rosso/40 bg-ac-rossoBg p-3 text-sm font-semibold text-ac-rosso" data-testid={`${testIdPrefix}-error`}>
          {error}
        </div>
      )}

      <style>{`@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
