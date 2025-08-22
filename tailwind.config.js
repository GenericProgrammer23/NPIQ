/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1f2937',        // slate-800  (new base page background)
        'navy-light': '#334155',// slate-700  (cards/strips slightly lighter)
        'navy-dark': '#0f172a', // slate-900  (headers/bars)
        'dark-cyan': '#007E7D',
        goldenrod: '#E3A72F',
        cream: '#F4EDE4',
      },
    },
  },
  plugins: [],
};