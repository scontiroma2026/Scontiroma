import { Link } from "react-router-dom";

// OPTION C — Street Roma (Archivo Black + JetBrains Mono, dark, neon, tape, marquee)
export default function PreviewC() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        .street-c { font-family: 'Inter', sans-serif; }
        .street-c-display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .street-c-mono { font-family: 'JetBrains Mono', monospace; }
        .noise-bg {
          background-image:
            radial-gradient(circle at 30% 30%, rgba(255,107,0,0.15) 0, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(180,255,57,0.1) 0, transparent 50%);
        }
        .tape {
          background: rgba(255,107,0,0.9);
          transform: rotate(-2deg);
          box-shadow: 0 4px 20px rgba(255,107,0,0.4);
        }
        .grain::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.08'/></svg>");
          pointer-events: none;
        }
      `}</style>
      <main className="street-c min-h-screen bg-[#0A0A0A] text-white noise-bg relative overflow-hidden grain">
        <Link to="/preview" className="fixed left-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-xs font-bold text-black">← Torna alle opzioni</Link>

        {/* Nav */}
        <nav className="border-b border-white/10 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="street-c-display text-2xl text-[#FF6B00]">S/R</div>
              <span className="street-c-display text-xl">SCONTI ROMA</span>
              <span className="street-c-mono text-xs text-[#B4FF39]">v1.0</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="street-c-mono text-sm text-white/60 hover:text-white">./login</button>
              <button className="rounded-none bg-[#FF6B00] px-5 py-2.5 text-sm font-bold uppercase text-black hover:bg-[#B4FF39] transition">
                Get Access →
              </button>
            </div>
          </div>
        </nav>

        {/* Marquee ticker */}
        <div className="border-b border-white/10 bg-[#FF6B00] py-2 overflow-hidden">
          <div className="street-c-mono text-xs uppercase text-black whitespace-nowrap" style={{animation: 'ticker 30s linear infinite'}}>
            {"// LIVE // 6 spots online // Trastevere -50% // Testaccio -55% // Monti -64% // EUR -75% // ".repeat(4)}
          </div>
          <style>{`@keyframes ticker { from {transform: translateX(0)} to {transform: translateX(-50%)} }`}</style>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <div className="street-c-mono text-xs text-[#B4FF39]">[LOC=ROMA · MODE=STREET]</div>
              <h1 className="mt-4 street-c-display text-6xl uppercase leading-[0.9] md:text-8xl">
                ROMA<br/>
                <span className="text-[#FF6B00]">— A META</span><br/>
                PREZZO.
              </h1>
              <p className="mt-6 max-w-lg text-white/70">
                €2,99/mese. Un pass. Tutta la città. Nessun BS, nessuna trappola.
                Solo sconti veri dai locali che conosci.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button className="street-c-display uppercase bg-[#FF6B00] px-8 py-4 text-black hover:bg-[#B4FF39] transition text-sm">
                  Attiva ora →
                </button>
                <button className="street-c-mono text-sm underline underline-offset-4 hover:text-[#B4FF39]">
                  → Scopri gli spot
                </button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-6 max-w-md street-c-mono">
                <div>
                  <div className="text-3xl text-[#FF6B00]">50+</div>
                  <div className="text-xs text-white/50 uppercase">spots</div>
                </div>
                <div>
                  <div className="text-3xl text-[#B4FF39]">12</div>
                  <div className="text-xs text-white/50 uppercase">areas</div>
                </div>
                <div>
                  <div className="text-3xl">€2.99</div>
                  <div className="text-xs text-white/50 uppercase">/month</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 relative">
              <div className="relative border border-white/20 aspect-[3/4] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=700" className="h-full w-full object-cover grayscale contrast-125" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="street-c-mono text-xs text-[#B4FF39]">[SPOT#001]</div>
                  <div className="street-c-display text-3xl uppercase mt-1">Pizzeria Testaccio</div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="street-c-display text-4xl text-[#FF6B00]">−53%</span>
                    <span className="street-c-mono text-xs text-white/60">pizza+beer</span>
                  </div>
                </div>
              </div>
              {/* Tape sticker */}
              <div className="absolute -top-4 left-8 tape px-4 py-1">
                <span className="street-c-display text-xs uppercase text-black">Hot Deal</span>
              </div>
              <div className="absolute -bottom-4 right-4 border-2 border-[#B4FF39] bg-black px-3 py-2">
                <span className="street-c-mono text-xs text-[#B4FF39]">$ SAVE €8.00</span>
              </div>
            </div>
          </div>
        </section>

        {/* Spot grid */}
        <section className="border-t border-white/10 mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="street-c-mono text-xs text-[#B4FF39]">[TRENDING NOW]</div>
              <h2 className="street-c-display text-4xl uppercase mt-2">Spot del giorno</h2>
            </div>
            <button className="street-c-mono text-xs text-white/60 hover:text-[#FF6B00]">view all →</button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", t: "TRATTORIA MARCO", z: "Trastevere", off: "50%" },
              { img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500", t: "CAFFÈ CORSO", z: "Centro", off: "56%" },
              { img: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500", t: "EUR FITNESS", z: "EUR", off: "75%" },
            ].map((d, i) => (
              <div key={i} className="group border border-white/10 hover:border-[#FF6B00] transition">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={d.img} className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="" />
                  <div className="absolute right-0 top-0 bg-[#FF6B00] px-3 py-1">
                    <span className="street-c-display text-xl text-black">−{d.off}</span>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="street-c-display text-lg uppercase">{d.t}</div>
                    <div className="street-c-mono text-xs text-white/50">{d.z.toLowerCase()}</div>
                  </div>
                  <span className="street-c-mono text-[#B4FF39] text-sm">→</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
