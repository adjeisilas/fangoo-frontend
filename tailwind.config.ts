import type { Config } from 'tailwindcss';

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F5F6F8',
          100: '#E6E9EF',
          200: '#C7CEDB',
          300: '#9AA6BE',
          400: '#6B7A98',
          500: '#4A5876',
          600: '#33405C',
          700: '#232E47',
          800: '#161E32',
          900: '#0C1322',
          950: '#060B16',
        },
        // The orange of the drop and "oo" in the Fangoo logo, anchored at 400 — the
        // shade primary buttons and accents use. Dark text on 400 is 6.9:1.
        brand: {
          50: '#FFF7ED',
          100: '#FFEBD3',
          200: '#FFD3A5',
          300: '#FFAD5C',
          400: '#FC7C00',
          500: '#E86E00',
          600: '#C45A00',
          700: '#9D4705',
          800: '#7F3A0B',
          900: '#68310D',
        },
        sand: {
          50: '#FCFBF8',
          100: '#F6F4EE',
          200: '#EDE9DF',
          300: '#DFD9C9',
        },
      },
      spacing: {
        // Tailwind's default scale skips 13. `AppButton` size="lg" uses `h-13`, which
        // silently generated nothing until this existed.
        13: '3.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgb(12 19 34 / 0.06), 0 12px 32px -8px rgb(12 19 34 / 0.10)',
        lift: '0 8px 20px -6px rgb(12 19 34 / 0.12), 0 24px 48px -12px rgb(12 19 34 / 0.16)',
        glow: '0 10px 40px -12px rgb(252 124 0 / 0.35)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
};
