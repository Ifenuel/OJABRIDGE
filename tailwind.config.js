/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ob-purple': '#5B21B6',
        'ob-purple-dark': '#4C1D95',
        'ob-purple-light': '#7C3AED',
        'ob-lime': '#7ED321',
        'ob-lime-dark': '#65A30D',
        'ob-navy': '#0F172A',
        'ob-navy-light': '#1E293B',
        'ob-light': '#F6F7FB',
        'ob-gold': '#FFC107',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
