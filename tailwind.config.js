/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f5f5',
          100: '#e6e6e6',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
          950: '#0d0d0d',
        },
        accent: {
          50: '#fbf7f1',
          100: '#f7eee2',
          200: '#efddc5',
          300: '#e7cca8',
          400: '#dfba8b',
          500: '#d7a96d',
          600: '#ac8757',
          700: '#816642',
          800: '#56442c',
          900: '#2b2216',
          950: '#161108',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Bethany Elingston', 'Playfair Display', 'serif'],
        serif: ['Bethany Elingston', 'Playfair Display', 'serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};