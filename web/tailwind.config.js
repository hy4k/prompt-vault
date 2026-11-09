/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#07070B',
        panel: '#0D0D13',
        gold: {
          DEFAULT: '#FFD633',
          soft: '#F4DE6B',
          deep: '#A8842A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Clash Display"', 'Inter', 'ui-sans-serif', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 50px -12px rgba(255, 214, 51, 0.35)',
        'gold-lg': '0 24px 70px -18px rgba(255, 214, 51, 0.28)',
        card: '0 10px 36px -14px rgba(0, 0, 0, 0.65)',
      },
      maxWidth: {
        shell: '72rem',
      },
    },
  },
  plugins: [],
}
