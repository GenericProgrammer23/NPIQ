/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#134e4a',        // teal-900  (deep teal)
        'navy-light': '#115e59',// teal-800
        'navy-dark': '#0f766e', // teal-700
        goldenrod: '#E3A72F',
        cream: '#F4EDE4',
      },
    },
  },
  plugins: [],
};