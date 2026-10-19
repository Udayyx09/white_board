/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#ffffff',
          dark: '#121212',
          subtle: '#f5f5f7',
          border: '#e0e0e0',
          borderDark: '#2c2c2c',
        },
        excali: {
          primary: '#6965db',
          hover: '#5b57d1',
          selected: '#e0dfff',
          darkSelected: '#2e2b5e',
          surface: '#ffffff',
          surfaceDark: '#232329',
          panel: '#ffffff',
          panelDark: '#1e1e24',
          gray: '#ececf4',
          grayDark: '#2b2a33',
        }
      },
      fontFamily: {
        hand: ['Virgil', 'Segoe Print', 'Comic Sans MS', 'Chalkboard SE', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        island: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'island-dark': '0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
        dialog: '0 12px 36px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
