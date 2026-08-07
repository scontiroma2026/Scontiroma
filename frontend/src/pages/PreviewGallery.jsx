import { Link } from "react-router-dom";

const OPTIONS = [
  { id: "a", name: "Pop Comic", tag: "SBAM!", desc: "Fumetto POW, giallo/rosso/blu, bordi spessi", bg: "bg-yellow-300", text: "text-black", accent: "bg-red-500" },
  { id: "b", name: "Neo Retro Italia", tag: "Dolce", desc: "Gelateria '80, pastelli saturi, sticker", bg: "bg-pink-100", text: "text-purple-900", accent: "bg-pink-500" },
  { id: "c", name: "Street Roma", tag: "OFF!", desc: "Street art, arancio fluo su nero", bg: "bg-black", text: "text-white", accent: "bg-orange-500" },
  { id: "d", name: "Bubblegum Deals", tag: "Y2K", desc: "Fucsia/ciano/lavanda, bolle e sparkle", bg: "bg-fuchsia-100", text: "text-fuchsia-900", accent: "bg-cyan-400" },
];

export default function PreviewGallery() {
  return (
    <main className="min-h-screen bg-cream px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-5xl">4 direzioni per il redesign</h1>
        <p className="mt-2 text-espresso/70">Clicca su una card per vedere l'anteprima a schermo intero. Dimmi qual è la tua preferita.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {OPTIONS.map((o) => (
            <Link key={o.id} to={`/preview/${o.id}`} data-testid={`preview-link-${o.id}`}
              className={`group relative block overflow-hidden rounded-3xl border-4 border-black p-8 shadow-[8px_8px_0_0_#000] transition-transform hover:-translate-y-1 ${o.bg} ${o.text}`}>
              <div className="text-xs uppercase tracking-[0.2em] opacity-70">Opzione {o.id.toUpperCase()}</div>
              <div className="mt-3 font-serif text-4xl leading-tight">{o.name}</div>
              <p className="mt-2 text-sm opacity-80">{o.desc}</p>
              <div className={`absolute -right-4 -top-4 flex h-20 w-20 rotate-12 items-center justify-center rounded-full text-white font-bold text-xs uppercase ${o.accent}`}>
                {o.tag}
              </div>
              <div className="mt-6 text-sm underline">Apri anteprima →</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
