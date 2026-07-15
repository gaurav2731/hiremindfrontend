/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f1115',
        surface: '#161922',
        primary: '#6366f1',
        muted: '#9ca3af',
      },
    },
  },
  plugins: [],
}
