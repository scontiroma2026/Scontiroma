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
          ink: '#221E1B',      // testo principale, nero caldo (su bianco: 16.5:1)
          soft: '#5B544D',     // testo secondario (su bianco: 7.4:1)
          mute: '#6A635B',     // testo di servizio (su bianco: 5.9:1)
          line: '#ECE7DF',     // bordi leggeri, grigio-caldo
          campo: '#A39B8F',    // bordo dei campi da compilare
          tint: '#FAF8F5',     // fondo avorio chiarissimo
          rosa: '#D81B72',     // fucsia del sito, versione per fondo bianco
          rosaBg: '#FFEEF2',
          rosaSoft: '#FFF6EE',
          viola: '#0B6FA4',      // nome storico: ora è l'azzurro (secondo accento al posto del viola)
          violaBg: '#E8F3F9',
          teal: '#00798C',
          tealBg: '#E9F6F8',
          verde: '#127A47',
          verdeBg: '#DDF6EA',
          ambra: '#8A5200',
          ambraBg: '#FFF1D6',
          rosso: '#B42318',
          rossoBg: '#FEE4E2',
        },
        // Tavolozza unica del sito (tema chiaro «Bianco vivo», versione calda: niente viola/lilla): stessi nomi di prima, colori adatti al fondo bianco
        fucsia: '#B3135C', // fucsia del sito, un filo più scuro per il testo su fondi chiari (≥ 4.5:1 anche sui riquadri avorio)
        ciano: '#00697A',
        neon: '#8A5200',
        limone: '#127A47',
        gold: '#00697A',
        terracotta: '#D81B72',
        espresso: '#221E1B',
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