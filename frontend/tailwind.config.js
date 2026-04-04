/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT:'#0ea5e9', 50:'#f0f9ff', 100:'#e0f2fe', 500:'#0ea5e9', 600:'#0284c7', 700:'#0369a1', 900:'#0c4a6e' },
        dark:    { DEFAULT:'#0f172a', 800:'#1e293b', 700:'#334155', 600:'#475569' },
      },
      fontFamily: {
        sans: ['"Inter"','system-ui','sans-serif'],
        mono: ['"JetBrains Mono"','monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        glow: '0 0 20px rgb(14 165 233 / 0.3)',
      },
    },
  },
  plugins: [],
}
