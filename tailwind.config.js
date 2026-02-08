/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#13ec5b",
        "primary-dark": "#0ea641",
        "background-light": "#f6f8f6",
        "background-dark": "#102216",
        "surface-light": "#ffffff",
        "surface-dark": "#1a3322",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
