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
        dark: {
          950: '#090d16',
          900: '#0d1322',
          850: '#11182c',
          800: '#172036',
          750: '#1d2844',
          700: '#263353',
          600: '#384872',
          500: '#52669b',
        },
        proc: {
          ready: '#38bdf8',
          running: '#22c55e',
          blocked: '#f59e0b',
          terminated: '#ef4444',
          waiting: '#eab308'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-right': 'flowRight 1.5s linear infinite',
      },
      keyframes: {
        flowRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
