import { Link } from "react-router-dom";

// OPTION A — Pop Comic (Bagel Fat One + Space Grotesk, halftone, thick borders)
export default function PreviewA() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Space+Grotesk:wght@400;600;700&display=swap');
        .pop-a { font-family: 'Space Grotesk', sans-serif; }
        .pop-a-display { font-family: 'Bagel Fat One', cursive; }
        .halftone {
          background-image: radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px);
          background-size: 12px 12px;
        }
        .shadow-pop { box-shadow: 8px 8px 0 0 #000; }
        .shadow-pop-lg { box-shadow: 12px 12px 0 0 #000; }
      `}</style>
      <main className="pop-a min-h-screen bg-[#FFE94A] text-black overflow-hidden">
        <Link to="/preview" className="fixed left-4 top-4 z-50 rounded-full border-2 border-black bg-white px-4 py-2 text-xs font-bold shadow-pop">← Torna alle opzioni</Link>

        {/* Nav */}
        <nav className="border-b-4 border-black bg-white halftone">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-[#FF3355] text-white pop-a-display text-xl">S</div>
              <span className="pop-a-display text-2xl">SCONTI ROMA</span>
            </div>
            <div className="flex gap-2">
              <button className="rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-bold">Accedi</button>
              <button className="rounded-full border-2 border-black bg-[#2E4BFF] px-4 py-2 text-sm font-bold text-white shadow-pop">ISCRIVITI</button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="absolute right-10 top-8 rotate-12 rounded-full border-4 border-black bg-[#FF3355] px-6 py-3 text-white pop-a-display text-4xl shadow-pop-lg">POW!</div>
          <div className="absolute right-40 top-40 -rotate-6 rounded-full border-4 border-black bg-[#2E4BFF] px-4 py-2 text-white font-bold shadow-pop">-70%</div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="inline-block rounded-full border-2 border-black bg-white px-4 py-1 text-xs font-bold">🍕 SOLO A ROMA</div>
              <h1 className="mt-4 pop-a-display text-7xl leading-[0.95] md:text-8xl">
                SCONTI<br/>
                <span className="text-[#FF3355]">A PALATA!</span>
              </h1>
              <p className="mt-4 max-w-md text-lg font-medium">
                2,99€ al mese e ti mangi Roma a metà prezzo. Zero commissioni, ZERO seccature.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full border-4 border-black bg-black px-8 py-4 text-lg font-bold text-white shadow-pop-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition">
                  PARTIAMO! →
                </button>
                <button className="rounded-full border-4 border-black bg-white px-8 py-4 text-lg font-bold shadow-pop">
                  Sfoglia sconti
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="rotate-2 rounded-3xl border-4 border-black bg-white p-6 shadow-pop-lg">
                <div className="aspect-square overflow-hidden rounded-2xl border-2 border-black">
                  <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" alt="pizza" className="h-full w-full object-cover" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase opacity-60">Pizzeria Testaccio</div>
                    <div className="pop-a-display text-2xl">Pizza + Birra</div>
                  </div>
                  <div className="rounded-full border-2 border-black bg-[#FFE94A] px-3 py-1 pop-a-display text-xl">€7</div>
                </div>
              </div>
              <div className="absolute -left-8 -bottom-6 -rotate-6 rounded-2xl border-4 border-black bg-[#2E4BFF] p-4 text-white shadow-pop">
                <div className="pop-a-display text-3xl">SBAM!</div>
                <div className="text-xs font-bold">RISPARMI €8</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works strip */}
        <section className="border-y-4 border-black bg-[#FF3355] py-4 overflow-hidden">
          <div className="flex gap-8 whitespace-nowrap text-white pop-a-display text-3xl animate-marquee" style={{animation: 'marquee 20s linear infinite'}}>
            {"★ 50 LOCALI ★ 12 QUARTIERI ★ 2,99€/MESE ★ ZERO STRESS ★ ".repeat(4)}
          </div>
          <style>{`@keyframes marquee { from {transform: translateX(0)} to {transform: translateX(-50%)} }`}</style>
        </section>

        {/* Discount grid */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="pop-a-display text-5xl">GLI SCONTI DEL MOMENTO</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", t: "Menu Degustazione", s: "Trattoria da Marco", off: "50%", c: "#FFE94A" },
              { img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500", t: "Cappuccino + Cornetto", s: "Caffè del Corso", off: "56%", c: "#FF3355" },
              { img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500", t: "Massaggio 60min", s: "Aurora SPA", off: "50%", c: "#2E4BFF" },
            ].map((d, i) => (
              <div key={i} className="rounded-3xl border-4 border-black bg-white shadow-pop-lg overflow-hidden hover:-translate-y-1 transition">
                <div className="relative aspect-video overflow-hidden">
                  <img src={d.img} className="h-full w-full object-cover" alt="" />
                  <div className={`absolute right-3 top-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-black text-white pop-a-display text-lg`} style={{background: d.c === '#FFE94A' ? '#000' : d.c}}>
                    -{d.off}
                  </div>
                </div>
                <div className="border-t-4 border-black p-4" style={{background: d.c, color: d.c === '#FFE94A' ? '#000' : '#fff'}}>
                  <div className="pop-a-display text-2xl leading-tight">{d.t}</div>
                  <div className="text-sm font-bold opacity-80">{d.s}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
