/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050B18',
          900: '#080F1F',
          800: '#0D1526',
          700: '#111D33',
          600: '#172240',
        },
        accent: { DEFAULT: '#3B82F6', glow: '#60A5FA' }
      },
      fontFamily: { mono: ['JetBrains Mono', 'Fira Code', 'monospace'] }
    },
  },
  plugins: [],
}
