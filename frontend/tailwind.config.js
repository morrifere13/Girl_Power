/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f8d0d6',
          300: '#f2aab4',
          400: '#eb7a8b',
          500: '#e04f65',
          600: '#cb3a50',
          700: '#aa2a3d',
          800: '#8f2536',
          900: '#782231',
        },
        surface: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f4f4f5',
          300: '#e4e4e7',
          900: '#18181b',
        },
        accent: {
          light: '#2dd4bf',
          DEFAULT: '#0d9488',
          dark: '#0f766e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 30px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
