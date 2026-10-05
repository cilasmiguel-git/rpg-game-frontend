/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{html,ts,scss}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        rpg: {
          gold: '#c5a059',
          goldLight: '#dfc282',
          bronze: '#8c6b30',
          iron: '#2a231c',
          ironBorder: '#3a322a',
          blood: '#8b0000',
          bloodLight: '#9a2a2a',
          bone: '#eae3d2',
          parchment: '#dfd5bf',
          hp: '#8b0000',
          mp: '#2c4f85',
          emerald: '#2b633b',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['"EB Garamond"', 'Garamond', 'Georgia', 'serif'],
        rpg: ['Cinzel', 'serif'],
        pixel: ['"Press Start 2P"', '"Silkscreen"', 'monospace'],
        arcade: ['"Silkscreen"', '"Press Start 2P"', 'monospace'],
        decorative: ['"Cinzel Decorative"', 'Cinzel', 'serif'],
        medieval: ['MedievalSharp', 'cursive', 'serif'],
        modern: ['Outfit', 'sans-serif'],
        eaves: ['"Mrs Eaves"', '"Mrs Eaves Small Caps"', '"Libre Baskerville"', 'Cinzel', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'pixel-sm': '2px 2px 0px 0px rgba(0,0,0,0.9)',
        'pixel': '3px 3px 0px 0px rgba(0,0,0,0.95)',
        'pixel-lg': '5px 5px 0px 0px rgba(0,0,0,0.95)',
        'pixel-gold': '3px 3px 0px 0px rgba(197,160,89,0.7)',
        'pixel-inset': 'inset 2px 2px 0px 0px rgba(0,0,0,0.8), inset -2px -2px 0px 0px rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
