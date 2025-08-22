/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light theme surfaces (so the app isn't stark white)
        navy: '#1B3B4A', 
        'navy-light': '#2A4A5A', 
        'navy-dark': '#15323E', 
        'dark-cyan': '#007E7D', 
        goldenrod: '#E3A72F', 
        cream: '#F4EDE4',
      },
    },
  },
  plugins: [],
};
