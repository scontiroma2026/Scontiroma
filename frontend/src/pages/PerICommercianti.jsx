import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { salvaFonte, registraVisitaFonte } from "@/lib/referral";
import { Button } from "@/components/ui/button";
import VideoCommercianti from "@/components/VideoCommercianti";
import RiquadroCiPensiamoNoi, { WHATSAPP_NUMERO } from "@/components/RiquadroCiPensiamoNoi";
import { trackClick } from "@/lib/analytics";

// Dai social arrivano commercianti che leggono ma non si iscrivono (dati admin del 01/11): un invito diretto
// a scrivere su WhatsApp, con un messaggio già pronto, è più facile di un modulo.
const WHATSAPP_INFO = `https://wa.me/39${WHATSAPP_NUMERO.replace(/\s/g, "")}?text=${encodeURIComponent("Ciao, ho un negozio e vorrei sapere come funziona Sconti Roma.")}`;

function TastoWhatsApp({ testid, dove }) {
  return (
    <a data-testid={testid} href={WHATSAPP_INFO} target="_blank" rel="noreferrer"
      onClick={() => trackClick(`whatsapp_commercianti_${dove}`)}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 text-base font-extrabold text-white hover:bg-emerald-800">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.8-1.1-4.6-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.2Z"/></svg>
      Scrivici su WhatsApp
    </a>
  );
}

const PASSI = [
  { n: "1", t: "Scegli cosa offrire", d: "Un prodotto o un servizio del tuo negozio, a tua scelta." },
  { n: "2", t: "Decidi le regole", d: "Tu stabilisci lo sconto, i giorni in cui vale e quante volte al mese." },
  { n: "3", t: "Il cliente mostra il QR", d: "In negozio inquadri il QR dal telefono e applichi lo sconto." },
];

const FAQ = [
  { q: "Quanto costa?", a: "Hai 2 mesi di prova gratuita (almeno 60 giorni) dalla pubblicazione della tua prima offerta. Prima di qualsiasi pagamento ti avvisiamo e non paghi niente senza la tua conferma. I dettagli sono nei Termini, punto 3.2." },
  { q: "Quanto tempo serve?", a: "Pochi minuti per registrarti e creare la prima offerta. Poi una al mese." },
  { q: "Chi decide lo sconto?", a: "Lo decidi tu: prodotto o servizio, sconto, giorni e quante volte al mese." },
  { q: "Come vengo trovato?", a: "Dopo un nostro controllo, la tua offerta compare nell'app per chi abita a Roma e dintorni." },
  { q: "Che dati vedo dei clienti?", a: "Alla scansione vedi nome e iniziale del cognome, l'ora, l'offerta e se il cliente è nuovo o di ritorno." },
];

export default function PerICommercianti() {
  const [params] = useSearchParams();
  useEffect(() => {
    // QR del volantino (?fonte=): si ricorda per la registrazione del negozio e si conta la visita (anonima)
    salvaFonte(params.get("fonte"));
    registraVisitaFonte(params.get("fonte"), "negozio", (fonte, tipo) => api.post("/fonte/visita", { fonte, tipo }).catch(() => {}));
  }, [params]);
  return (
    <main data-testid="per-i-commercianti-page" className="mx-auto max-w-3xl px-6 py-12 text-foreground">
      <div className="text-xs uppercase tracking-[0.2em] text-gold">Per i commercianti</div>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl text-foreground">
        Nuovi clienti vicino al tuo negozio
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Sconti Roma porta nel tuo negozio le persone che abitano vicino a te, a Roma e dintorni.
        Pubblichi un'offerta, il cliente la trova nell'app e arriva con il suo QR.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <TastoWhatsApp testid="cta-whatsapp-alto" dove="alto" />
        <span className="text-sm text-muted-foreground"><strong className="text-foreground">2 mesi di prova gratuita.</strong> Hai domande? Ti rispondiamo noi, senza impegno.</span>
      </div>

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

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild className="min-h-12 rounded-full grad-fucsia-viola px-8 text-white">
          <Link data-testid="cta-registra-attivita" to="/register?role=merchant">Registra la tua attività</Link>
        </Button>
        <TastoWhatsApp testid="cta-whatsapp-basso" dove="basso" />
      </div>

      <RiquadroCiPensiamoNoi testid="ci-pensiamo-noi-commercianti" className="mt-10" />

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
