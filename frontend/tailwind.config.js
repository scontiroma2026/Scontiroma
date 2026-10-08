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
          ink: '#1A1530',      // testo principale (su bianco: 16:1)
          soft: '#5E5875',     // testo secondario (su bianco: 6.9:1)
          mute: '#6B6580',     // testo di servizio (su bianco: 5.6:1)
          line: '#EADFF0',     // bordi leggeri
          campo: '#B9B0D0',    // bordo dei campi da compilare
          tint: '#F6F1FB',     // fondo lavanda chiarissimo
          rosa: '#D81B72',     // fucsia del sito, versione per fondo bianco
          rosaBg: '#FFE3F0',
          rosaSoft: '#FFF0F7',
          viola: '#6D4AFF',
          violaBg: '#EDE8FF',
          teal: '#00798C',
          tealBg: '#E6F7FA',
          verde: '#127A47',
          verdeBg: '#DDF6EA',
          ambra: '#8A5200',
          ambraBg: '#FFF1D6',
          rosso: '#B42318',
          rossoBg: '#FEE4E2',
        },
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