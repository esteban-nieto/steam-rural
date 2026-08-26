/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2e7d32',
        secondary: '#1565c0',
        accent: '#ff9800',
        surface: '#f0fdf4',
      },
    },
  },
  plugins: [],
}
