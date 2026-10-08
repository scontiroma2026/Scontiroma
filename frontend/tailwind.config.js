/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // Titoli in Fraunces su tutti i telefoni (prima la classe font-serif di Tailwind
      // vinceva sul CSS e iPhone/Android mostravano font diversi)
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        // Area commerciante, variante «D · Bianco vivo»: fondo chiaro, accenti vivi.
        // Usati solo dalle pagine /merchant/* (vedi src/area-commerciante.css)
        ac: {
          ink: '#221C10',      // testo principale, nero caldo (su bianco: 16.9:1); è anche il testo sopra l'ambra
          soft: '#5B544D',     // testo secondario (su bianco: 7.4:1)
          mute: '#6A635B',     // testo di servizio (su bianco: 5.9:1)
          line: '#EFE5D8',     // bordi leggeri, sabbia chiara
          campo: '#A39B8F',    // bordo dei campi da compilare
          tint: '#FFF9E8',     // fondo miele chiarissimo
          pesca: '#FFF6F0',    // fondo pesca chiarissimo
          miele: '#F4A81D',    // ambra/miele pieno: evidenziazioni, badge, fasce (testo sopra: mieleInk, 8.4:1)
          mieleInk: '#221C10',
          mieleBg: '#FFF9E8',
          rosa: '#C42A50',      // corallo scuro per testi e bordi (≥ 4.9:1 anche sui fondi pesca e miele)
          corallo: '#D6355C',  // corallo pieno dei pulsanti (testo bianco 4.6:1)     // fucsia del sito, versione per fondo bianco
          rosaBg: '#FFEEF1',
          rosaSoft: '#FFF6F0',
          viola: '#F4A81D',      // nome storico: ora è il miele pieno (riempimenti, barre, puntini)
          violaBg: '#FFF4D6',
          teal: '#0C768C',       // teal di etichette, link e icone (su bianco 5.3:1)
          tealBg: '#EAF6F8',
          verde: '#127A47',
          verdeBg: '#E4F6EC',
          ambra: '#8A5200',
          ambraBg: '#FFF1D6',
          rosso: '#B42318',
          rossoBg: '#FEE4E2',
        },
        // Tavolozza unica del sito (tema chiaro «Bianco vivo», versione calda: niente viola/lilla): stessi nomi di prima, colori adatti al fondo bianco
        fucsia: '#C42A50', // corallo scuro per il testo e i bordi (nome storico «fucsia», ≥ 4.9:1 anche sui riquadri pesca e miele)
        miele: '#F4A81D',
        ciano: '#0C768C',
        neon: '#8A5200',
        limone: '#127A47',
        gold: '#0C768C',
        terracotta: '#D6355C',
        espresso: '#221C10',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};