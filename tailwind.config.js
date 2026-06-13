/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          950: '#0c0a09',
        },
        chesto: {
          cream: '#F7F4EE',
          dark: '#1a1714',
          charcoal: '#2e2b27',
          gold: '#C9A84C',
          'gold-light': '#E8C97A',
          rust: '#A84C2E',
          sage: '#4C7A5A',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      fontSize: {
        '7xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },
      aspectRatio: {
        'photo': '3 / 2',
        'portrait': '2 / 3',
        'square': '1 / 1',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
