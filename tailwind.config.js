/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#008080',
        secondary: '#4A90E2',
        background: '#F5F7FA',
      }
    },
  },
  plugins: [],
}