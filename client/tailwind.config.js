/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette lifted from the Skull King box: black field, gold ornamental type,
        // a crimson bandana/wax-seal red, and stormy blue-grey behind the lightning/ship art.
        ink: {
          DEFAULT: '#0c0b0a',
          800: '#17140f',
          700: '#221d16',
        },
        parchment: {
          50: '#fbf6e9',
          100: '#f4ead0',
          200: '#e9d8ac',
          300: '#dcc282',
          400: '#c7a561',
        },
        gold: {
          200: '#f2dd9a',
          300: '#e8cf7a',
          400: '#d4af37',
          500: '#b8912a',
          600: '#8f6f1c',
          700: '#6b5316',
        },
        crimson: {
          300: '#c25c68',
          400: '#a8323f',
          500: '#8b1e2b',
          600: '#6b141f',
          700: '#4a0e16',
        },
        storm: {
          300: '#7c93a8',
          400: '#5b7186',
          500: '#3d5163',
          600: '#2b3a4a',
          700: '#1c2733',
          800: '#121a22',
        },
      },
      fontFamily: {
        display: ['"Pirata One"', 'cursive'],
        body: ['"IM Fell English"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 6px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)',
        rope: 'inset 0 0 0 2px rgba(212,175,55,0.5)',
      },
      backgroundImage: {
        'wood-grain':
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 6px)',
        'parchment-fiber':
          'radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05), transparent 40%), radial-gradient(circle at 80% 60%, rgba(0,0,0,0.05), transparent 45%)',
      },
      animation: {
        'flip-reveal': 'flip-reveal 0.5s ease-out',
        'card-deal': 'card-deal 0.35s ease-out',
        'trick-win': 'trick-win 0.6s ease-in-out',
      },
      keyframes: {
        'flip-reveal': {
          '0%': { transform: 'rotateY(90deg)', opacity: '0.3' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        'card-deal': {
          '0%': { transform: 'translateY(-12px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'trick-win': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
