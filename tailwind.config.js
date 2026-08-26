/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FDF8F0',
        ink: '#1A2E1A',
        paramo: '#2D5016',
        moss: '#7A9E7E',
        clay: '#C47A3C',
        mist: '#E8F0E8',
        surface: '#FDF8F0',
        primary: '#2D5016',
        secondary: '#7A9E7E',
        accent: '#C47A3C',
      },
      fontFamily: {
        display: ['Baloo 2', 'cursive'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 4px 20px rgba(45,80,22,0.08), 0 1px 3px rgba(45,80,22,0.12)',
        lift: '0 12px 32px rgba(45,80,22,0.14), 0 4px 12px rgba(45,80,22,0.10)',
      },
      borderRadius: {
        paper: '20px',
      }
    },
  },
  plugins: [],
}
