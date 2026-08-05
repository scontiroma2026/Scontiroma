import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Sparkles, TicketPercent, Utensils, Wine, Coffee, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import DiscountCard from "@/components/DiscountCard";

export default function Landing() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/discounts").then((r) => setFeatured((r.data.discounts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <main data-testid="landing-page" className="text-espresso">
      {/* HERO */}
      <section className="hero-noise relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-14 md:grid-cols-12 md:gap-14 md:pb-24 md:pt-20">
          <div className="md:col-span-7 fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warm bg-white/70 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <Sparkles size={12} /> Solo a Roma · €4,99 al mese
            </div>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Assaggia Roma.<br />
              <span className="italic text-terracotta">Un quartiere,</span><br />
              cento sconti.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-espresso/70">
              Un abbonamento a pochi euro. Uno sconto reale in ogni bottega, trattoria e caffè di Roma.
              Nessuna commissione, nessuna sorpresa — solo la dolce vita a metà prezzo.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button data-testid="cta-start" size="lg" className="bg-terracotta text-white hover:bg-terracotta/90">
                  Inizia ora <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link to="/discounts">
                <Button data-testid="cta-browse" size="lg" variant="outline" className="border-espresso/20 bg-white hover:bg-parchment">
                  Sfoglia gli sconti
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-warm pt-6 max-w-md">
              <Stat n="50+" l="Locali partner" />
              <Stat n="12" l="Quartieri" />
              <Stat n="€4,99" l="Al mese" />
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=900"
                alt="Roma"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-transparent p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-white/70">In evidenza</div>
                <div className="mt-1 font-serif text-2xl text-white">Trastevere, ore 20:00</div>
                <div className="text-sm text-white/80">Menu degustazione a metà prezzo</div>
              </div>
            </div>
            <div className="absolute -left-6 top-10 hidden rotate-[-6deg] rounded-xl border border-warm bg-white p-4 shadow-lg md:block">
              <div className="text-[10px] uppercase tracking-wider text-gold">Membership</div>
              <div className="font-serif text-2xl">€4,99<span className="text-sm text-espresso/50">/mese</span></div>
            </div>
            <div className="absolute -right-4 bottom-16 hidden rotate-[4deg] rounded-xl border border-warm bg-white p-4 shadow-lg md:block">
              <div className="flex items-center gap-2 text-xs text-terracotta"><TicketPercent size={14} /> Sconto attivo</div>
              <div className="font-serif text-lg leading-tight">50% Aurora SPA</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-warm bg-parchment">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gold">Come funziona</div>
              <h2 className="mt-2 font-serif text-4xl">Tre passi, sconti veri.</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Abbonati", d: "€4,99 al mese. Cancelli quando vuoi. Nessuna carta d'ingresso." },
              { n: "02", t: "Scegli lo sconto", d: "Filtra per zona di Roma o per categoria. Trova il tuo posto." },
              { n: "03", t: "Mostra il QR", d: "Il commerciante scansiona il codice. Paghi il prezzo scontato." },
            ].map((s) => (
              <Card key={s.n} className="border-warm bg-white p-8">
                <div className="font-serif text-5xl text-terracotta">{s.n}</div>
                <div className="mt-3 font-serif text-2xl">{s.t}</div>
                <p className="mt-2 text-sm text-espresso/70">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">In vetrina</div>
            <h2 className="mt-2 font-serif text-4xl">Gli sconti più amati</h2>
          </div>
          <Link to="/discounts" data-testid="link-see-all" className="text-sm text-terracotta hover:underline">
            Vedi tutti →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((d) => <DiscountCard key={d.id} discount={d} />)}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-warm bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Categorie</div>
          <h2 className="mt-2 font-serif text-4xl">Per ogni gusto romano</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {[
              { i: <Utensils size={18} />, l: "Ristoranti" },
              { i: <Coffee size={18} />, l: "Bar & Caffè" },
              { i: <Wine size={18} />, l: "Vino" },
              { i: <TicketPercent size={18} />, l: "Beauty" },
              { i: <MapPin size={18} />, l: "Cultura" },
              { i: <Sparkles size={18} />, l: "Shopping" },
            ].map((c) => (
              <div key={c.l} className="flex flex-col items-center gap-2 rounded-xl border border-warm bg-parchment px-4 py-6 text-espresso/80 transition-colors hover:border-terracotta hover:text-terracotta">
                {c.i}
                <div className="text-sm">{c.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MERCHANT CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 rounded-2xl border border-warm bg-espresso p-10 text-white md:grid-cols-2 md:p-14">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Per i commercianti</div>
            <h2 className="mt-3 font-serif text-4xl leading-tight">Un solo sconto, migliaia di nuovi clienti.</h2>
            <p className="mt-4 text-white/70">
              Sei un esercente romano? Pubblica un'offerta e appari nell'app che i romani consultano ogni giorno.
              Nessun costo, solo visibilità.
            </p>
            <Link to="/register?role=merchant">
              <Button data-testid="cta-merchant" className="mt-6 bg-gold text-espresso hover:bg-gold/90">
                Diventa partner
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatDark n="+40%" l="clienti nuovi" />
            <StatDark n="0€" l="commissioni" />
            <StatDark n="24h" l="attivazione" />
            <StatDark n="1 clic" l="per pubblicare" />
          </div>
        </div>
      </section>

      <footer className="border-t border-warm py-8 text-center text-xs text-espresso/60">
        © {new Date().getFullYear()} Sconti Roma — Made with amore
      </footer>
    </main>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div className="font-serif text-2xl text-espresso">{n}</div>
      <div className="text-xs uppercase tracking-wider text-espresso/50">{l}</div>
    </div>
  );
}

function StatDark({ n, l }) {
  return (
    <div className="rounded-xl border border-white/10 p-5">
      <div className="font-serif text-3xl text-gold">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{l}</div>
    </div>
  );
}
