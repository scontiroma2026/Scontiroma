import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import ListaAttesaForm from "@/components/ListaAttesaForm";
import BrandMark from "@/components/BrandMark";

// Home mostrata SOLO con PRELAUNCH_MODE acceso: nessuna data, nessun numero. I negozi restano raggiungibili.
export default function PrelaunchHome() {
  return (
    <main data-testid="prelaunch-home" className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-16 md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs uppercase tracking-[0.2em]">
          <Sparkles size={12} className="text-fucsia" aria-hidden="true" /> Roma e dintorni
        </div>
        <h1 data-testid="prelaunch-titolo" className="mt-6 font-serif text-5xl leading-[1] md:text-7xl">
          Stiamo arrivando a <span className="text-grad">Roma e dintorni</span>
        </h1>
        <p data-testid="prelaunch-testo" className="mt-6 max-w-xl text-lg text-foreground/80">
          Sconti Roma porta le offerte dei negozi vicino a te in un posto solo: scegli un'offerta, mostri il QR al banco e basta.
          Lasciaci la tua email e ti avvisiamo noi quando parte. Sconti Roma è per maggiorenni (18+).
        </p>
        <div data-testid="prelaunch-modulo" className="mt-8 rounded-2xl border border-border bg-muted p-6">
          <ListaAttesaForm testid="lista-attesa" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-2xl border border-border p-6">
          <h2 className="font-serif text-2xl">Hai un negozio?</h2>
          <p className="mt-2 text-foreground/80">
            Iscriviti e carica la tua prima offerta: resta in attesa e compare insieme alle altre quando partiamo.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link to="/register?role=merchant" data-testid="prelaunch-negozio-iscriviti"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-fucsia px-6 text-sm font-semibold text-white">
              Iscrivi il tuo negozio
            </Link>
            <Link to="/per-i-commercianti" data-testid="prelaunch-negozio-info"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-input px-6 text-sm font-semibold text-foreground">
              Come funziona per i negozi
            </Link>
            <Link to="/login" data-testid="prelaunch-accedi"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-foreground underline underline-offset-4">
              Accedi
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          © {new Date().getFullYear()} <BrandMark inline className="text-muted-foreground" /> — Made con amore ♡
        </span>
      </footer>
    </main>
  );
}
