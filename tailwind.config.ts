import type {Config} from 'next';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontSize: {
      xs: ['0.625625rem', { lineHeight: '0.84875rem' }],
      sm: ['0.7371875rem', { lineHeight: '1.071875rem' }],
      base: ['0.84875rem', { lineHeight: '1.295rem' }],
      lg: ['0.9603125rem', { lineHeight: '1.55rem' }],
      xl: ['1.071875rem', { lineHeight: '1.55rem' }],
      '2xl': ['1.295rem', { lineHeight: '1.74125rem' }],
      '3xl': ['1.6296875rem', { lineHeight: '1.964375rem' }],
      '4xl': ['1.964375rem', { lineHeight: '2.1875rem' }],
      '5xl': ['2.63375rem', { lineHeight: '1' }],
      '6xl': ['3.303125rem', { lineHeight: '1' }],
      '7xl': ['3.9725rem', { lineHeight: '1' }],
      '8xl': ['5.31125rem', { lineHeight: '1' }],
      '9xl': ['7.09625rem', { lineHeight: '1' }],
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        header: {
          DEFAULT: "hsl(var(--header-background))",
          foreground: "hsl(var(--header-foreground))",
        },
        // Colores de estado para lotes
        status: {
          'tomar-accion': '#669bbc',
          'tasacion': '#dda15e',
          'evolucionando': '#219ebc',
          'disponible': '#ffb703',
          'descartado': '#0d1b2a',
          'no-vende': '#c1121f',
          'reservado': '#fb8500',
          'vendido': '#4f772d',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
