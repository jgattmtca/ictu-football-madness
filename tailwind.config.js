/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
      },
      animation: {
        'race-bounce': 'raceBounce 0.6s ease-in-out infinite alternate',
        'crown-float': 'crownFloat 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.5s ease-out',
        'confetti-fall': 'confettiFall 3s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'rank-change': 'rankChange 0.4s ease-out',
      },
      keyframes: {
        raceBounce: {
          '0%':   { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-4px)' },
        },
        crownFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(-5deg)' },
          '50%':      { transform: 'translateY(-6px) rotate(5deg)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(251,191,36,0)' },
          '50%':      { boxShadow: '0 0 20px 6px rgba(251,191,36,0.4)' },
        },
        rankChange: {
          '0%':   { backgroundColor: 'rgba(251,191,36,0.4)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
