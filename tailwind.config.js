/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C3CE1',
        accent: '#FFD93D',
        dark: '#1A1A2E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1A1A2E 0%, #2d1b69 50%, #1A1A2E 100%)',
        'cta-gradient': 'linear-gradient(135deg, #6C3CE1 0%, #4a28a8 100%)',
      },
    },
  },
  plugins: [],
};
