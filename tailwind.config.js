/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light theme surfaces (so the app isn't stark white)
        navy: '#f3f4f6',         // page background (slate-100)
        'navy-light': '#ffffff', // cards/panels
        'navy-dark': '#eef2f7',  // light strips/dividers

        // Keep your accents
        'dark-cyan': '#007E7D',
        goldenrod: '#E3A72F',

        // Text color (dark for light surfaces)
        cream: '#0f172a',        // slate-900

        // NEW: dedicated sidebar color (the original)
        sidebar: '#15323E',      // original 'navy-dark'
      },
    },
  },
  plugins: [],
};
