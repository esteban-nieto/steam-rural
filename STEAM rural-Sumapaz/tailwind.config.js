/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FDF8F0',
        'paper-deep': '#F5EDE0',
        ink: '#1A2E1A',
        paramo: '#2D5016',
        moss: '#6B8F71',
        frailejon: '#A8C686',
        terracota: '#C47A3C',
        'terracota-light': '#E8A87C',
        slateProfesor: '#4A5C6A',
        mist: '#E8F0E8',
        surface: '#FDF8F0',
        primary: '#2D5016',
        secondary: '#6B8F71',
        accent: '#C47A3C',
      },
      fontFamily: {
        display: ['Baloo 2', 'cursive'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 4px 20px rgba(45,80,22,0.08), 0 1px 3px rgba(45,80,22,0.12)',
        lift: '0 12px 32px rgba(45,80,22,0.14), 0 4px 12px rgba(45,80,22,0.10)',
        'paper-strong': '0 8px 32px rgba(45,80,22,0.12), 0 2px 8px rgba(45,80,22,0.10)',
      },
      borderRadius: {
        paper: '20px',
        'paper-lg': '28px',
      }
    },
  },
  plugins: [],
}
