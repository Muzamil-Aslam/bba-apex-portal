/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50:  '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f27474',
          500: '#e74444',
          600: '#c92626',
          700: '#891010',
          800: '#7b1010',
          900: '#6b1010',
          950: '#800000',
          // DEFAULT means `bg-maroon` (no suffix) maps to this value
          DEFAULT: '#800000',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          // DEFAULT means `bg-gold` / `text-gold` maps to this value
          DEFAULT: '#FFD700',
          dark: '#B8860B',
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      }
    },
  },
  plugins: [],
}
