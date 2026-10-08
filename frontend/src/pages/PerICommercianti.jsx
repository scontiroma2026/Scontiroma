import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import VideoCommercianti from "@/components/VideoCommercianti";

const PASSI = [
  { n: "1", t: "Scegli cosa offrire", d: "Un prodotto o un servizio del tuo negozio, a tua scelta." },
  { n: "2", t: "Decidi le regole", d: "Tu stabilisci lo sconto, i giorni in cui vale e quante volte al mese." },
  { n: "3", t: "Il cliente mostra il QR", d: "In negozio inquadri il QR dal telefono e applichi lo sconto." },
];

const FAQ = [
  { q: "Quanto costa?", a: "Nella fase di lancio è gratis. Poi ti avvisiamo con largo anticipo e non paghi niente senza la tua conferma." },
  { q: "Quanto tempo serve?", a: "Pochi minuti per registrarti e creare la prima offerta. Poi una al mese." },
  { q: "Chi decide lo sconto?", a: "Lo decidi tu: prodotto o servizio, sconto, giorni e quante volte al mese." },
  { q: "Come vengo trovato?", a: "Dopo un nostro controllo, la tua offerta compare nell'app per chi abita a Roma e dintorni." },
  { q: "Che dati vedo dei clienti?", a: "Alla scansione vedi nome e iniziale del cognome, l'ora, l'offerta e se il cliente è nuovo o di ritorno." },
];

export default function PerICommercianti() {
  return (
    <main data-testid="per-i-commercianti-page" className="mx-auto max-w-3xl px-6 py-12 text-foreground">
      <div className="text-xs uppercase tracking-[0.2em] text-gold">Per i commercianti</div>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl text-foreground">
        Nuovi clienti dal tuo quartiere
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Sconti Roma porta nel tuo negozio le persone che abitano vicino a te, a Roma e dintorni.
        Pubblichi un'offerta, il cliente la trova nell'app e arriva con il suo QR.
      </p>

      <div className="mt-8">
        <VideoCommercianti />
      </div>

      <section className="mt-12" aria-labelledby="passi-titolo">
        <h2 id="passi-titolo" className="font-serif text-3xl">Come funziona in 3 passi</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {PASSI.map((p) => (
            <li key={p.n} data-testid={`passo-${p.n}`} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fucsia/10 font-serif text-lg text-fucsia">{p.n}</div>
              <h3 className="mt-3 font-serif text-xl">{p.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 text-center">
        <Button asChild className="min-h-12 rounded-full grad-fucsia-viola px-8 text-white">
          <Link data-testid="cta-registra-attivita" to="/register?role=merchant">Registra la tua attività</Link>
        </Button>
      </div>

      <section className="mt-12" aria-labelledby="faq-titolo">
        <h2 id="faq-titolo" className="font-serif text-3xl">Domande veloci</h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-muted px-5 py-4">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between font-semibold">
                <span className="font-serif text-lg">{f.q}</span>
                <span className="text-2xl text-fucsia transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
