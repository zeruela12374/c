/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e3d28',
          light: '#4a5a44',
          dark: '#1a2415'
        },
        secondary: {
          DEFAULT: '#cddc39',
          light: '#d4e157',
          dark: '#afb42b'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        serif: ['PT Serif', 'serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}