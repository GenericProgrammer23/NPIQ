/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: '#1B3B4A',
        'navy-light': '#2A4A5A',
        'navy-dark': '#1A323E',
        'dark-cyan': '#007E7D',
        goldenrod: '#E3A72F',
        cream: '#152733',
        'cream-light': '#F4EDE4',
        // Dark mode colors matching login page
        'dark-navy': '#15323E',
        'dark-navy-light': '#1B3B4A',
        'sidebar-navy': '#1A323E',
      },
    },
  },
  plugins: [],
};