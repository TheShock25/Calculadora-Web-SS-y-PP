/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/main/resources/static/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF7F2',
          100: '#F4EFE7',
          200: '#ECE6DC',
          300: '#DDD5C8',
        },
        sage: {
          50: '#F1F7F2',
          100: '#E1EEE4',
          200: '#C6DFCC',
          300: '#A8CDB0',
          500: '#8FB996',
          600: '#6B9080',
          700: '#4F7366',
        },
        peach: {
          50: '#FFF6EE',
          100: '#FDE8D6',
          200: '#F9D2B1',
          400: '#F4A261',
          500: '#E08A47',
          600: '#B8662A',
        },
        charcoal: {
          DEFAULT: '#2F3E46',
          muted: '#6C7A82',
          light: '#9EABB2',
        },
        macro: {
          hc: '#F6D88E',
          prot: '#F4A28C',
          lip: '#C7B5E2',
        },
        food: {
          verdura: '#B8E0C8',
          fruta: '#FFD6A5',
          cereal: '#FBE7A1',
          legum: '#E8D5B7',
          animal: '#F6B8A8',
          leche: '#BFDDF5',
          grasa: '#D9C8EC',
          azucar: '#F7C6D9',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      }
    },
  },
  plugins: [],
}
