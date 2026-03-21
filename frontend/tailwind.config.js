/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: { primary: '#0a0f1e', secondary: '#111827', card: '#1a2235' },
        accent: { green: '#4ade80', amber: '#f59e0b', red: '#ef4444', blue: '#3b82f6' }
      }
    }
  },
  plugins: []
}