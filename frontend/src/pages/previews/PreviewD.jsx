import { Link } from "react-router-dom";

// OPTION D — Bubblegum Deals (Fraunces + Manrope, Y2K blobs, sparkles, gradient)
export default function PreviewD() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Manrope:wght@400;500;700;800&display=swap');
        .bg-d { font-family: 'Manrope', sans-serif; }
        .bg-d-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; font-weight: 800; }
        .grad-1 { background: linear-gradient(135deg, #FF2E93 0%, #7A5CFF 100%); }
        .grad-2 { background: linear-gradient(135deg, #00E5FF 0%, #7A5CFF 100%); }
        .grad-3 { background: linear-gradient(135deg, #FFD93D 0%, #FF2E93 100%); }
        @keyframes float { 0%,100% {transform: translateY(0)} 50% {transform: translateY(-15px)} }
        @keyframes spin-slow { to {transform: rotate(360deg)} }
        .blob1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; filter: blur(80px); opacity: 0.5; }
      `}</style>
      <main className="bg-d min-h-screen bg-[#F5F0FF] text-[#1A0533] relative overflow-hidden">
        <Link to="/preview" className="fixed left-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-xs font-bold shadow-lg">← Torna alle opzioni</Link>

        {/* Background blobs */}
        <div className="blob1 bg-[#FF2E93] top-[-100px] left-[-100px]" />
        <div className="blob1 bg-[#00E5FF] top-[300px] right-[-150px]" />
        <div className="blob1 bg-[#FFD93D] bottom-[100px] left-[30%]" />

        {/* Nav */}
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="grad-1 flex h-11 w-11 items-center justify-center rounded-2xl text-white font-black text-xl" style={{animation: 'spin-slow 8s linear infinite'}}>✦</div>
            <span className="bg-d-display text-2xl">Sconti Roma</span>
          </div>
          <div className="flex gap-3">
            <button className="rounded-full bg-white px-5 py-2 text-sm font-bold shadow">Accedi</button>
            <button className="grad-1 rounded-full px-6 py-2 text-sm font-bold text-white shadow-lg hover:scale-105 transition">
              ✨ Iscriviti
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-4 py-2 text-xs font-bold shadow">
                <span>✨</span>
                <span>Novità · €4,99 al mese</span>
                <span>✨</span>
              </div>
              <h1 className="mt-6 bg-d-display text-7xl leading-[0.95] md:text-8xl">
                Roma è<br/>
                <span className="bg-gradient-to-r from-[#FF2E93] via-[#7A5CFF] to-[#00E5FF] bg-clip-text text-transparent">un vibe.</span><br/>
                A metà prezzo.
              </h1>
              <p className="mt-6 max-w-md text-lg text-[#1A0533]/70 font-medium">
                Un abbonamento carino carino e ti sblocchiamo Roma tutta.
                Ristoranti, bar, gelato, palestra: <strong>tutto scontato</strong>. Insomma, che aspetti?
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="grad-1 rounded-full px-8 py-4 text-white font-bold shadow-xl hover:scale-105 transition flex items-center gap-2">
                  Inizia il vibe <span>→</span>
                </button>
                <button className="rounded-full bg-white px-8 py-4 font-bold shadow-lg">
                  Sfoglia sconti
                </button>
              </div>

              {/* Chip stats */}
              <div className="mt-10 flex flex-wrap gap-3">
                {[
                  { l: "50+ locali", c: "grad-1" },
                  { l: "12 quartieri", c: "grad-2" },
                  { l: "Cancelli quando vuoi", c: "grad-3" },
                ].map((s, i) => (
                  <div key={i} className={`${s.c} rounded-full px-5 py-2 text-white font-semibold text-sm shadow-lg`}>
                    {s.l}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Main visual - big blob */}
              <div className="grad-1 relative aspect-square rounded-[45%_55%_60%_40%/50%_40%_60%_50%] p-6 shadow-2xl" style={{animation: 'float 6s ease-in-out infinite'}}>
                <div className="h-full w-full rounded-[45%_55%_60%_40%/50%_40%_60%_50%] overflow-hidden bg-white">
                  <img src="https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=700" className="h-full w-full object-cover" alt="" />
                </div>
              </div>
              {/* Floating deals */}
              <div className="absolute -left-6 top-16 rounded-3xl bg-white p-4 shadow-2xl" style={{animation: 'float 4s ease-in-out infinite'}}>
                <div className="text-xs font-bold text-[#FF2E93]">🍦 Gelateria Monti</div>
                <div className="bg-d-display text-2xl mt-1">Coppa €2</div>
                <div className="text-xs line-through text-gray-400">€5,50</div>
              </div>
              <div className="absolute -right-4 bottom-10 grad-2 rounded-3xl p-4 text-white shadow-2xl" style={{animation: 'float 5s ease-in-out infinite'}}>
                <div className="text-xs">Risparmi</div>
                <div className="bg-d-display text-3xl">€3,50</div>
                <div className="text-xs opacity-80">solo oggi ⚡</div>
              </div>
              <div className="absolute top-2 right-8 text-4xl" style={{animation: 'spin-slow 6s linear infinite'}}>✨</div>
              <div className="absolute bottom-4 left-16 text-3xl" style={{animation: 'float 3s ease-in-out infinite'}}>💖</div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#FF2E93] font-bold">✨ Vibe check</div>
              <h2 className="bg-d-display text-5xl mt-2">Sconti che spaccano</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500", t: "Cappu + Cornetto", s: "Caffè del Corso", price: "€2", from: "€4,50", g: "grad-1", emoji: "☕" },
              { img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", t: "Menu completo", s: "Trattoria Marco", price: "€22,50", from: "€45", g: "grad-2", emoji: "🍝" },
              { img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500", t: "Massaggio SPA", s: "Aurora SPA", price: "€40", from: "€80", g: "grad-3", emoji: "💆" },
            ].map((d, i) => (
              <div key={i} className="group rounded-3xl bg-white p-5 shadow-xl hover:-translate-y-2 hover:shadow-2xl transition duration-300">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <img src={d.img} className="h-full w-full object-cover" alt="" />
                  <div className={`${d.g} absolute right-3 top-3 rounded-full h-14 w-14 flex items-center justify-center text-white font-black text-xs shadow-lg`}>
                    −{Math.round((1 - parseFloat(d.price.replace('€','').replace(',','.')) / parseFloat(d.from.replace('€','').replace(',','.'))) * 100)}%
                  </div>
                  <div className="absolute left-3 top-3 text-3xl">{d.emoji}</div>
                </div>
                <div className="mt-4 px-2">
                  <div className="text-xs font-bold text-[#7A5CFF]">{d.s}</div>
                  <div className="bg-d-display text-2xl mt-1">{d.t}</div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="bg-d-display text-3xl bg-gradient-to-r from-[#FF2E93] to-[#7A5CFF] bg-clip-text text-transparent">{d.price}</span>
                    <span className="text-sm line-through text-gray-400">{d.from}</span>
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
