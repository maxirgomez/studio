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
      xs: ['0.563125rem', { lineHeight: '0.78625rem' }],
      sm: ['0.6746875rem', { lineHeight: '1.009375rem' }],
      base: ['0.78625rem', { lineHeight: '1.2325rem' }],
      lg: ['0.8978125rem', { lineHeight: '1.4875rem' }],
      xl: ['1.009375rem', { lineHeight: '1.4875rem' }],
      '2xl': ['1.2325rem', { lineHeight: '1.67875rem' }],
      '3xl': ['1.5671875rem', { lineHeight: '1.901875rem' }],
      '4xl': ['1.901875rem', { lineHeight: '2.125rem' }],
      '5xl': ['2.57125rem', { lineHeight: '1' }],
      '6xl': ['3.240625rem', { lineHeight: '1' }],
      '7xl': ['3.91rem', { lineHeight: '1' }],
      '8xl': ['5.24875rem', { lineHeight: '1' }],
      '9xl': ['7.03375rem', { lineHeight: '1' }],
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
