/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-[#E14434]",
    "bg-[#FFF3A0]",
    "divide-[#E14434]/30",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}