import { Link } from "react-router-dom";

// OPTION B — Neo Retro Italia (Fraunces italic + DM Sans, pastelli saturi, curves, stickers)
export default function PreviewB() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,300..800;9..144,1,300..800&family=DM+Sans:wght@400;500;700&display=swap');
        .retro-b { font-family: 'DM Sans', sans-serif; }
        .retro-b-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        .blob-bg {
          background:
            radial-gradient(600px circle at 20% 30%, rgba(255,92,168,0.35), transparent 40%),
            radial-gradient(500px circle at 80% 20%, rgba(41,217,182,0.4), transparent 40%),
            radial-gradient(500px circle at 70% 80%, rgba(255,217,61,0.35), transparent 40%),
            radial-gradient(400px circle at 15% 90%, rgba(122,92,255,0.3), transparent 40%);
        }
      `}</style>
      <main className="retro-b min-h-screen bg-[#FFF5F0] text-[#2A0E3D] overflow-hidden relative">
        <Link to="/preview" className="fixed left-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-xs font-bold shadow-lg">← Torna alle opzioni</Link>

        <div className="absolute inset-0 blob-bg pointer-events-none" />

        {/* Nav */}
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF5CA8] text-white retro-b-display italic text-xl font-bold">s</div>
            <span className="retro-b-display italic text-2xl font-semibold">Sconti Roma</span>
          </div>
          <div className="flex gap-3">
            <button className="rounded-full bg-white/70 px-5 py-2 text-sm font-medium backdrop-blur">Accedi</button>
            <button className="rounded-full bg-[#7A5CFF] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-purple-300">Iscriviti</button>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold shadow-md">
                <span className="h-2 w-2 rounded-full bg-[#29D9B6]" /> Fresco come un gelato al pistacchio
              </div>
              <h1 className="mt-6 retro-b-display text-6xl font-semibold leading-[0.95] md:text-7xl">
                Roma,<br/>
                <span className="italic text-[#FF5CA8]">dolcemente</span><br/>
                scontata.
              </h1>
              <p className="mt-6 max-w-md text-lg text-[#2A0E3D]/70">
                Un abbonamento a €2,99 e ogni quartiere diventa il tuo parco giochi.
                Sconti veri, come una limonata al bar sotto casa.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="rounded-full bg-[#2A0E3D] px-8 py-4 text-white font-semibold shadow-xl hover:scale-105 transition">
                  Iniziamo la dolce vita →
                </button>
                <button className="rounded-full bg-white px-8 py-4 font-semibold shadow-lg">
                  Vedi gli sconti
                </button>
              </div>

              {/* Sticker row */}
              <div className="mt-10 flex gap-4">
                <div className="rotate-[-8deg] rounded-2xl bg-[#FFD93D] px-4 py-3 shadow-lg">
                  <div className="retro-b-display italic text-2xl">50+</div>
                  <div className="text-xs">locali</div>
                </div>
                <div className="rotate-[5deg] rounded-2xl bg-[#29D9B6] px-4 py-3 text-white shadow-lg">
                  <div className="retro-b-display italic text-2xl">12</div>
                  <div className="text-xs">quartieri</div>
                </div>
                <div className="rotate-[-3deg] rounded-2xl bg-[#7A5CFF] px-4 py-3 text-white shadow-lg">
                  <div className="retro-b-display italic text-2xl">€2,99</div>
                  <div className="text-xs">al mese</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-[40%_60%_50%_50%/40%_50%_50%_60%] overflow-hidden aspect-square shadow-2xl">
                <img src="https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=700" className="h-full w-full object-cover" alt="" />
              </div>
              {/* Floating sticker cards */}
              <div className="absolute -left-6 top-8 rotate-[-6deg] rounded-2xl bg-white p-4 shadow-2xl">
                <div className="text-xs font-medium text-[#FF5CA8]">🍦 Gelato</div>
                <div className="retro-b-display italic text-xl">Coppa a €2</div>
                <div className="text-[10px] line-through text-[#2A0E3D]/40">€5,50</div>
              </div>
              <div className="absolute -right-4 bottom-16 rotate-[8deg] rounded-2xl bg-[#FF5CA8] p-4 text-white shadow-2xl">
                <div className="text-xs">Risparmi</div>
                <div className="retro-b-display italic text-3xl">€3,50</div>
              </div>
              <div className="absolute -bottom-4 left-16 rotate-[-4deg] rounded-full bg-[#FFD93D] px-5 py-2 shadow-lg">
                <span className="retro-b-display italic text-lg font-bold">— 60% oggi</span>
              </div>
            </div>
          </div>
        </section>

        {/* Discount cards */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10">
            <div className="text-xs uppercase tracking-widest text-[#FF5CA8]">Freschi di giornata</div>
            <h2 className="retro-b-display italic text-5xl">Gli sconti che amerai</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500", t: "Cappuccino + Cornetto", s: "Caffè del Corso", price: "€2", from: "€4,50", c: "#FF5CA8" },
              { img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", t: "Menu Degustazione", s: "Trattoria da Marco", price: "€22,50", from: "€45", c: "#7A5CFF" },
              { img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500", t: "Massaggio Rilassante", s: "Aurora SPA", price: "€40", from: "€80", c: "#29D9B6" },
            ].map((d, i) => (
              <div key={i} className="group rounded-3xl bg-white p-4 shadow-xl hover:-translate-y-2 transition duration-300">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <img src={d.img} className="h-full w-full object-cover" alt="" />
                  <div className="absolute right-3 top-3 rounded-full px-3 py-1 text-white text-xs font-bold shadow-lg" style={{background: d.c}}>
                    Preferito ♡
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs font-semibold" style={{color: d.c}}>{d.s}</div>
                  <div className="retro-b-display italic text-2xl mt-1">{d.t}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="retro-b-display italic text-3xl font-bold" style={{color: d.c}}>{d.price}</span>
                    <span className="text-sm line-through opacity-40">{d.from}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
