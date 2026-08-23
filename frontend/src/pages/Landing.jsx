import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, MapPin, ArrowRight, Zap, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import DiscountCard from "@/components/DiscountCard";

// Rome landmark imagery (Unsplash direct URLs)
const ROMA_HERO = "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80"; // Colosseo
const ROMA_TREVI = "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&q=80"; // Trevi
const ROMA_TRAST = "https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=800&q=80"; // Trastevere alley
const ROMA_PIAZZA = "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800&q=80"; // Piazza

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    api.get("/discounts").then((r) => setFeatured((r.data.discounts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <main data-testid="landing-page" className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background Rome image with heavy overlay */}
        <div className="absolute inset-0">
          <img src={ROMA_HERO} className="h-full w-full object-cover opacity-30" alt="Roma" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A]/95 via-[#0A0A0A]/70 to-[#0A0A0A]" />
        </div>
        {/* Neon blobs */}
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-fucsia/30 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-ciano/30 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pt-28">
          <div className="grid gap-12 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7 fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] backdrop-blur">
                <Sparkles size={12} className="text-neon" /> €2,99 al mese · Solo Roma
              </div>
              <h1 className="mt-6 font-serif text-6xl leading-[0.95] md:text-8xl">
                Roma è<br/>
                <span className="text-grad">tutta tua.</span><br/>
                <span className="italic">A metà prezzo.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-white/70">
                Un abbonamento e ti sblocchiamo la città. Dal caffè a Trastevere alla pizza a Testaccio,
                dalla SPA a Prati alla palestra all'EUR: <strong className="text-neon">tutto scontato</strong>.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/register">
                  <Button data-testid="cta-start" size="lg" className="grad-fucsia-viola glow-fucsia text-white font-bold hover:scale-105 transition text-base px-8 py-6 rounded-full">
                    Inizia ora <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <Link to="/discounts">
                  <Button data-testid="cta-browse" size="lg" variant="outline" className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur px-8 py-6">
                    Sfoglia sconti
                  </Button>
                </Link>
              </div>

              {/* Chip stats */}
              <div className="mt-10 flex flex-wrap gap-3">
                <Chip label="50+ locali" grad="grad-fucsia-viola" />
                <Chip label="Cancelli quando vuoi" grad="grad-ciano-fucsia" />
                <Chip label="No commissioni" grad="grad-neon" dark />
              </div>
            </div>

            {/* Right: Rome collage */}
            <div className="md:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-2 border-fucsia glow-fucsia" style={{animation: 'float 6s ease-in-out infinite'}}>
                <img src={ROMA_TREVI} className="h-full w-full object-cover" alt="Trevi" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-6">
                  <div className="text-xs uppercase tracking-widest text-ciano">In evidenza</div>
                  <div className="font-serif text-3xl mt-1">Trevi, Centro Storico</div>
                  <div className="text-sm text-white/70">Aperitivo a €4 · −60%</div>
                </div>
              </div>
              {/* Floating deal cards */}
              <div className="absolute -left-6 top-10 rotate-[-6deg] rounded-2xl bg-fucsia p-4 shadow-2xl glow-fucsia" style={{animation: 'float 4s ease-in-out infinite'}}>
                <div className="text-[10px] uppercase text-white/80 tracking-widest">Membership</div>
                <div className="font-serif text-3xl text-white">€2,99<span className="text-sm">/mese</span></div>
              </div>
              <div className="absolute -right-4 bottom-20 rotate-[6deg] rounded-2xl bg-ciano p-4 text-black shadow-2xl glow-ciano" style={{animation: 'float 5s ease-in-out infinite'}}>
                <div className="flex items-center gap-1 text-xs font-bold"><Zap size={12} /> Sconto attivo</div>
                <div className="font-serif text-xl leading-tight">−50% Aurora SPA</div>
              </div>
              <div className="absolute -top-4 right-8 text-4xl text-neon" style={{animation: 'spin-slow 8s linear infinite'}}>✦</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <section className="relative border-y border-white/10 bg-fucsia py-3 overflow-hidden">
        <div className="whitespace-nowrap font-serif text-2xl text-white" style={{animation: 'marquee 30s linear infinite'}}>
          {"★ TRASTEVERE −50% ★ TESTACCIO −55% ★ MONTI −64% ★ EUR −75% ★ PRATI −50% ★ CENTRO −60% ★ ".repeat(4)}
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
            { n: "01", t: "Abbonati", d: "€2,99 al mese. Cancelli quando vuoi. Nessuna sorpresa in bolletta.", c: "fucsia" },
            { n: "02", t: "Scegli", d: "Filtra per quartiere di Roma o per categoria. Trova il tuo posto.", c: "ciano" },
            { n: "03", t: "Mostra il QR", d: "Il commerciante scansiona. Paghi il prezzo scontato. Amen.", c: "neon" },
          ].map((s) => (
            <Card key={s.n} className="relative border-white/10 bg-white/5 backdrop-blur p-8 hover:bg-white/10 transition group overflow-hidden">
              <div className={`absolute -top-4 -right-4 h-24 w-24 rounded-full bg-${s.c} opacity-20 blur-2xl`} />
              <div className={`font-serif text-6xl text-${s.c}`}>{s.n}</div>
              <div className="mt-3 font-serif text-2xl text-white">{s.t}</div>
              <p className="mt-2 text-sm text-white/70">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* NEIGHBOURHOODS SHOWCASE (Rome imagery) */}
      <section className="relative border-y border-white/10 bg-[#0F0F0F]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10">
            <div className="text-xs uppercase tracking-[0.2em] text-neon">I quartieri</div>
            <h2 className="mt-2 font-serif text-5xl">Ogni angolo di <span className="text-grad">Roma</span></h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { img: ROMA_TRAST, name: "Trastevere", deals: "12 sconti", c: "text-fucsia" },
              { img: ROMA_HERO, name: "Centro Storico", deals: "18 sconti", c: "text-ciano" },
              { img: ROMA_PIAZZA, name: "Testaccio", deals: "8 sconti", c: "text-neon" },
            ].map((q) => (
              <Link key={q.name} to="/discounts" className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10">
                <img src={q.img} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt={q.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className={`text-xs uppercase tracking-widest ${q.c}`}>{q.deals}</div>
                  <div className="font-serif text-4xl text-white">{q.name}</div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-white/60">
                    <MapPin size={12} /> Roma
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED discounts */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-fucsia">✦ Vibe check</div>
            <h2 className="mt-2 font-serif text-5xl">Gli sconti del momento</h2>
          </div>
          <Link to="/discounts" data-testid="link-see-all" className="text-sm text-ciano hover:underline">
            Vedi tutti →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((d) => <DiscountCard key={d.id} discount={d} />)}
        </div>
      </section>

      {/* MERCHANT CTA */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fucsia via-purple-700 to-ciano p-10 md:p-14">
          <div className="absolute top-4 right-8 text-6xl opacity-30" style={{animation: 'spin-slow 10s linear infinite'}}>✦</div>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/80">Per i commercianti</div>
              <h2 className="mt-3 font-serif text-5xl text-white leading-tight">
                Un solo sconto,<br/>migliaia di romani.
              </h2>
              <p className="mt-4 text-white/90 max-w-md">
                Sei un esercente di Roma? Pubblica un'offerta e appari nell'app che i romani consultano ogni giorno. Nessun costo, solo vibrazioni positive.
              </p>
              <Link to="/register?role=merchant">
                <Button data-testid="cta-merchant" className="mt-6 rounded-full bg-black text-white hover:bg-black/80 px-8 py-6">
                  Diventa partner <Heart size={16} className="ml-2 text-fucsia" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "+40%", l: "clienti nuovi" },
                { n: "0€", l: "commissioni" },
                { n: "24h", l: "attivazione" },
                { n: "1 clic", l: "per pubblicare" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/20 bg-black/30 backdrop-blur p-5">
                  <div className="font-serif text-4xl text-white">{s.n}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-white/70">{s.l}</div>
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
        <div className="space-y-3">
          {[
            { q: "Quanto costa Sconti Roma?", a: "€2,99 al mese. Nessun costo di attivazione, nessuna commissione nascosta. Puoi cancellare quando vuoi con un clic." },
            { q: "Come funziona uno sconto?", a: "Scegli un locale, apri il dettaglio e clicca 'Ottieni QR Code'. Mostri il QR (che cambia ogni 10 secondi per sicurezza) al commerciante, lui lo scansiona e paghi il prezzo scontato. Punto." },
            { q: "Perché il QR cambia ogni 10 secondi?", a: "Per evitare screenshot e raggiri. Il codice è unico e temporaneo: solo tu in quel momento puoi usarlo, così i commercianti sanno che sei un vero abbonato." },
            { q: "Quanti sconti posso usare in un mese?", a: "Ne puoi usare quanti vuoi, uno diverso per ogni locale partner. Alcuni negozi (contrassegnati con il badge '🔁 N× al mese') permettono anche più utilizzi ripetuti nello stesso mese — vedi la voce sotto." },
            { q: "🔁 Alcuni negozi permettono più utilizzi al mese: come funziona?", a: "Ogni commerciante decide se ti concede lo sconto una sola volta al mese oppure fino a 2, 3, 5 o addirittura 10 volte. Nella pagina del negozio vedrai un badge fucsia con il numero massimo (es. 'Fino a 3 utilizzi al mese per abbonato') e, se sei loggato e abbonato, un contatore che ti dice quanti utilizzi hai già consumato e quanti te ne restano (es. '2 / 3 · 1 rimasto'). Ogni utilizzo genera un QR code DIVERSO, quindi non puoi riciclare lo stesso codice." },
            { q: "Posso cancellare quando voglio?", a: "Sì. Vai in 'Il mio account' → 'Gestisci abbonamento' → 'Annulla abbonamento' e conferma. Nessuna penale, nessuna domanda, nessuna telefonata imbarazzante di retention." },
            { q: "Come posso pagare?", a: "Tramite Stripe: carta di credito, debito o wallet (Apple Pay, Google Pay). Pagamento sicuro, i tuoi dati non passano dai nostri server." },
            { q: "Sono un commerciante, come partecipo?", a: "Registrati come commerciante, crea la tua singola offerta e comparirai nel catalogo. Zero commissioni, zero costi di ingresso, solo nuovi clienti." },
            { q: "In quali quartieri di Roma funziona?", a: "Trastevere, Centro Storico, Prati, Testaccio, Monti, EUR, Ostiense, Parioli, San Giovanni, Trieste-Salario, Pigneto, Flaminio — e continuiamo ad aggiungerne." },
          ].map((f, i) => (
            <details key={i} className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4 open:border-fucsia/40 transition">
              <summary className="flex cursor-pointer items-center justify-between text-white font-semibold">
                <span className="font-serif text-lg">{f.q}</span>
                <span className="text-fucsia text-2xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Sconti Roma — Made con amore ♡
      </footer>
    </main>
  );
}

function Chip({ label, grad, dark }) {
  return (
    <div className={`${grad} rounded-full px-5 py-2 text-sm font-semibold shadow-lg ${dark ? "text-black" : "text-white"}`}>
      {label}
    </div>
  );
}
