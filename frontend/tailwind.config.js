/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f0d',
        surface: {
          DEFAULT: '#121815',
          light: '#18221d',
          card: '#0f1512'
        },
        sport: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(34, 197, 94, 0.3)',
        'glow-sm': '0 0 15px -3px rgba(34, 197, 94, 0.25)',
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
