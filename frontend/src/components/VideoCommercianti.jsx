import { useEffect, useState } from "react";
import { Play } from "lucide-react";

// Video di presentazione per i commercianti. Se il file /video/commercianti.mp4 esiste lo mostra,
// altrimenti mostra il segnaposto «Video in arrivo». Il sito risponde con la home anche per i
// file mancanti, quindi si controlla il tipo del file e non solo lo stato della risposta.
export const VIDEO_COMMERCIANTI = "/video/commercianti.mp4";

export default function VideoCommercianti() {
  const [presente, setPresente] = useState(false);

  useEffect(() => {
    let annullato = false;
    fetch(VIDEO_COMMERCIANTI, { method: "HEAD" })
      .then((r) => {
        const tipo = r.headers.get("content-type") || "";
        if (!annullato && r.ok && tipo.startsWith("video/")) setPresente(true);
      })
      .catch(() => {});
    return () => {
      annullato = true;
    };
  }, []);

  if (presente) {
    return (
      <video
        data-testid="video-commercianti"
        className="aspect-video w-full rounded-2xl border border-border bg-black"
        controls
        playsInline
        preload="metadata"
      >
        <source src={VIDEO_COMMERCIANTI} type="video/mp4" />
      </video>
    );
  }

  return (
    <div
      data-testid="video-segnaposto"
      className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted text-center"
    >
      <Play size={32} className="text-fucsia" aria-hidden="true" />
      <p className="font-serif text-xl text-foreground">Video in arrivo</p>
    </div>
  );
}
