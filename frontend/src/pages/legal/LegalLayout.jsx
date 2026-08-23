import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ title, kicker, updatedAt, children }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-white/85">
      <Link
        to="/"
        data-testid="legal-back"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold hover:text-terracotta transition"
      >
        <ArrowLeft size={14} /> Torna alla home
      </Link>

      <div className="mt-6 border-b border-white/10 pb-6">
        {kicker && (
          <div className="text-xs uppercase tracking-[0.2em] text-gold">{kicker}</div>
        )}
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl text-white">{title}</h1>
        {updatedAt && (
          <div className="mt-3 text-xs text-white/50">
            Ultimo aggiornamento: {updatedAt}
          </div>
        )}
      </div>

      <article
        data-testid="legal-content"
        className="legal-article mt-8 space-y-6 text-[15px] leading-relaxed"
      >
        {children}
      </article>

      <div className="mt-12 rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/60">
        Hai domande? Scrivi a{" "}
        <a
          href="mailto:info@scontiroma.it"
          className="text-fucsia hover:underline"
        >
          info@scontiroma.it
        </a>
        . Ti rispondiamo entro 24 ore.
      </div>
    </main>
  );
}
