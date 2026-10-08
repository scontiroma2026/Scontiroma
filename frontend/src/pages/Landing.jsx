import { salvaReferral } from "@/lib/referral";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, MapPin, ArrowRight, Heart } from "lucide-react";
import { useEffect } from "react";
import BrandMark from "@/components/BrandMark";

// Rome landmark imagery (Unsplash direct URLs)
const ROMA_HERO = "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80"; // Colosseo
const ROMA_TREVI = "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&q=80"; // Trevi

export default function Landing() {
  const [params] = useSearchParams();
  useEffect(() => {
    // Cattura referral merchant_id da QR personalizzato (?ref=) — persiste per la registrazione
    salvaReferral(params.get("ref"));
  }, [params]);

  return (
    <main data-testid="landing-page" className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background Rome image with heavy overlay */}
        <div className="absolute inset-0">
          <img src={ROMA_HERO} className="h-full w-full object-cover opacity-40" alt="Roma" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-white" />
        </div>
        {/* Neon blobs */}
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-muted blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-ciano/15 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pt-28">
          <div className="grid gap-12 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7 fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs uppercase tracking-[0.2em] backdrop-blur">
                <Sparkles size={12} className="text-neon" /> Roma e dintorni
              </div>
              <h1 className="mt-6 font-serif text-6xl leading-[0.95] md:text-8xl">
                Roma è<br/>
                <span className="text-grad">tutta tua.</span>
              </h1>
              <p data-testid="hero-sottotitolo" className="mt-5 max-w-xl font-serif text-3xl italic leading-tight text-foreground md:text-4xl">
                Scopri quanto puoi risparmiare nel tuo quartiere.
              </p>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Ti sblocchiamo il quartiere. Dal caffè alla pizza, dal parrucchiere alla palestra:
                <strong className="text-neon"> sconti nei negozi vicino a casa</strong>. In tutta Roma e dintorni.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/register">
                  <Button data-testid="cta-start" size="lg" className="grad-fucsia-viola glow-fucsia text-white font-bold hover:scale-105 transition text-base px-8 py-6 rounded-full">
                    Inizia ora <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <Link to="/discounts">
                  <Button data-testid="cta-browse" size="lg" variant="outline" className="rounded-full border-input bg-muted text-foreground hover:bg-muted backdrop-blur px-8 py-6">
                    Sfoglia sconti
                  </Button>
                </Link>
              </div>

            </div>

            {/* Right: Rome collage */}
            <div className="md:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-2 border-fucsia glow-fucsia" style={{animation: 'float 6s ease-in-out infinite'}}>
                <img src={ROMA_TREVI} className="h-full w-full object-cover" alt="Roma" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-6 pt-16">
                  <div className="text-xs uppercase tracking-widest text-ciano">Il progetto</div>
                  <div className="font-serif text-3xl mt-1">Roma, quartiere per quartiere</div>
                  <div className="text-sm text-muted-foreground">Dal centro alla periferia</div>
                </div>
              </div>
              <div className="absolute -top-4 right-8 text-4xl text-neon" style={{animation: 'spin-slow 8s linear infinite'}}>✦</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-ciano">Come funziona</div>
          <h2 className="mt-2 font-serif text-5xl">Tre passi. Zero stress.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Registrati", d: "Crea il tuo account in pochi secondi.", c: "fucsia" },
            { n: "02", t: "Scegli", d: "Filtra per quartiere di Roma o per categoria. Trova il tuo posto.", c: "ciano" },
            { n: "03", t: "Mostra il QR", d: "Il commerciante scansiona. Paghi il prezzo scontato. Amen.", c: "neon" },
          ].map((s) => (
            <Card key={s.n} className="relative border-border bg-muted backdrop-blur p-8 hover:bg-muted transition group overflow-hidden">
              <div className={`absolute -top-4 -right-4 h-24 w-24 rounded-full bg-${s.c} opacity-20 blur-2xl`} />
              <div className={`font-serif text-6xl text-${s.c}`}>{s.n}</div>
              <div className="mt-3 font-serif text-2xl text-foreground">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* NEIGHBOURHOODS SHOWCASE (Rome imagery) */}
      <section className="relative border-y border-border bg-muted">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10">
            <div className="text-xs uppercase tracking-[0.2em] text-neon">Dove siamo</div>
            <h2 className="mt-2 font-serif text-5xl">Il tuo <span className="text-grad">quartiere</span>, ovunque a Roma</h2>
          </div>
          <Link to="/discounts" className="group relative block overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-12">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-60 grad-fucsia-viola" />
            <div className="relative">
              <div className="text-xs uppercase tracking-widest text-fucsia">Roma e dintorni</div>
              <div className="mt-2 font-serif text-4xl text-foreground md:text-5xl">Dal centro alla periferia</div>
              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} /> Scopri le offerte vicino a te
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* MERCHANT CTA */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-border ac-grad p-10 md:p-14">
          <div className="absolute top-4 right-8 text-6xl text-white opacity-30" style={{animation: 'spin-slow 10s linear infinite'}}>✦</div>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white">Per i commercianti</div>
              <h2 className="mt-3 font-serif text-5xl text-white leading-tight">
                Un solo sconto,<br/>nuovi clienti dal quartiere.
              </h2>
              <p className="mt-4 text-white max-w-md">
                Hai un'attività a Roma o nei dintorni? Pubblica un'offerta e fatti trovare da chi abita vicino a te. Gratis durante la fase di lancio.
              </p>
              <Link to="/register?role=merchant">
                <Button data-testid="cta-merchant" className="mt-6 rounded-full bg-white text-ac-ink hover:bg-white/90 px-8 py-6">
                  Diventa partner <Heart size={16} className="ml-2 text-fucsia" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "Gratis", l: "fase di lancio" },
                { n: "16", l: "zone tra Roma e dintorni" },
                { n: "1", l: "offerta al mese" },
                { n: "1 clic", l: "per pubblicare" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white bg-white p-5">
                  <div className="font-serif text-4xl text-foreground">{s.n}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-neon">FAQ</div>
          <h2 className="mt-2 font-serif text-5xl">Domande frequenti</h2>
        </div>
        {[
          { titolo: "Per chi usa gli sconti", voci: [
            { q: "Quanto costa Sconti Roma?", a: "Per ora Sconti Roma è gratuito per chi usa gli sconti: registrarti e usare le offerte non costa nulla e non ti chiediamo dati di pagamento. Se in futuro cambiasse qualcosa te lo diremo con almeno 30 giorni di anticipo, e nessun pagamento partirà senza la tua conferma." },
            { q: "Come funziona uno sconto?", a: "Registrati, scegli un negozio, apri l'offerta e premi «Mostra QR Code». Mostri il QR al banco, il commerciante lo scansiona e paghi il prezzo scontato." },
            { q: "Perché il QR cambia ogni 20 secondi?", a: "Per evitare screenshot e usi scorretti: il codice è unico e vale solo per pochi secondi, così il commerciante sa che lo sconto è davvero tuo." },
            { q: "Quante volte posso usare uno sconto?", a: "Ogni negozio ha un'offerta al mese. Di solito la puoi usare una volta al mese; alcuni negozi permettono 2, 3, 5 o 10 utilizzi. Lo vedi nella pagina del negozio, con un contatore degli utilizzi rimasti (per esempio «2 / 3 · 1 rimasto»). In ogni negozio puoi usare lo sconto al massimo una volta al giorno." },
            { q: "Le offerte cambiano?", a: "Sì: ogni mese i commercianti possono pubblicare un'offerta nuova. Prima di comparire, ogni offerta viene controllata da noi." },
            { q: "In quali zone funziona?", a: "In tutta Roma, dal centro alla periferia, e nelle zone appena fuori città. Se nella tua zona ci sono ancora poche offerte, ricontrolla più avanti: i commercianti ne pubblicano di nuove ogni mese." },
            { q: "Come accedo all'app?", a: "Con email e password: il telefono può ricordarle per te. Se vuoi, attiva il Face ID dalla sezione «Sicurezza» del tuo account ed entri con un tocco. Dopo 5 tentativi sbagliati l'accesso si blocca per 15 minuti; se hai dimenticato la password usa «Password dimenticata?»." },
            { q: "Come cancello il mio account?", a: "Dalla pagina del tuo account, con il pulsante «Elimina il mio account». Per qualsiasi problema scrivici dalla pagina Assistenza, in fondo a ogni pagina." },
          ]},
          { titolo: "Per i commercianti", voci: [
            { q: "Come partecipo con il mio negozio?", a: "Registrati come commerciante e crea la tua offerta: la controlliamo e, dopo l'approvazione, il tuo negozio compare tra gli sconti." },
            { q: "Quanto costa per i commercianti?", a: "Durante la fase di lancio partecipare è gratuito. Dopo, il prezzo previsto è di 4,99 € al mese IVA inclusa, bloccato per chi partecipa dall'inizio. Ti avviseremo almeno 30 giorni prima e non ti addebiteremo nulla senza la tua conferma." },
            { q: "Come funziona l'offerta del mese?", a: "Hai un'offerta al mese. Negli ultimi 7 giorni del mese puoi caricare quella del mese successivo: ti avvisiamo nella dashboard e per email. L'offerta non si rinnova da sola: se non carichi la nuova, il 1° del mese quella attuale scade. Se non vuoi continuare, scegli «Non rinnovo»." },
            { q: "Come verifico lo sconto di un cliente?", a: "Dalla tua dashboard premi «Scansiona codice» e inquadra il QR del cliente: vedi subito se lo sconto è valido. Lo stesso QR non può essere usato due volte." },
          ]},
        ].map((g) => (
          <div key={g.titolo} className="mb-8">
            <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-ciano">{g.titolo}</h3>
            <div className="space-y-3">
              {g.voci.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-border bg-muted backdrop-blur px-5 py-4 open:border-fucsia/40 transition">
                  <summary className="flex cursor-pointer items-center justify-between text-foreground font-semibold">
                    <span className="font-serif text-lg">{f.q}</span>
                    <span className="text-fucsia text-2xl transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          © {new Date().getFullYear()} <BrandMark inline className="text-muted-foreground" /> — Made con amore ♡
        </span>
      </footer>
    </main>
  );
}
