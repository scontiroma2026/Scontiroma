import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

/** Segnaposto neutro quando un'offerta non ha foto. Mai un'immagine finta al posto della foto vera. */
export function NoPhoto({ className = "", testId = "no-photo" }) {
  return (
    <div
      data-testid={testId}
      role="img"
      aria-label="Nessuna foto"
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-ac-tint text-ac-soft ${className}`}
    >
      <ImageOff size={28} aria-hidden="true" />
      <span className="text-sm font-semibold">Nessuna foto</span>
    </div>
  );
}

/** Foto dell'offerta: se manca o non si carica, mostra «Nessuna foto» (non un'immagine di default). */
export function FotoOfferta({ src, alt, className = "", testId }) {
  const [rotta, setRotta] = useState(false);
  useEffect(() => { setRotta(false); }, [src]);
  if (!src || rotta) return <NoPhoto />;
  return <img data-testid={testId} src={src} alt={alt} className={className} onError={() => setRotta(true)} />;
}

export default NoPhoto;
