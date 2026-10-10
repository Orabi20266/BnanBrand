/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E75480',
          dark: '#C93C67',
          light: '#F0789B',
        },
        blush: {
          50: '#FFF7FB',
          100: '#FFE3EF',
          200: '#FFD7E8',
          300: '#FFC0CB',
          400: '#FFB6D9',
          500: '#F5A0C6',
        },
        ink: '#3B2B33',
        muted: '#B993A6',
      },
      fontFamily: {
        sans: ['Poppins', 'Cairo', 'Segoe UI', 'Tahoma', 'sans-serif'],
        arabic: ['Cairo', 'Poppins', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(231, 84, 128, 0.25)',
        card: '0 6px 24px -10px rgba(231, 84, 128, 0.22)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
