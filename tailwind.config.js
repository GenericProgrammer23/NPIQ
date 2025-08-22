/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#f8fafc',         // page background ≈ slate-50
        'navy-light': '#ffffff', // cards / panels
        'navy-dark': '#f1f5f9',  // headers / strips ≈ slate-100
        'dark-cyan': '#007E7D',
        goldenrod: '#E3A72F',
        cream: '#0f172a',
      },
    },
  },
  plugins: [],
};