import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
        },
        // Palette "Atelier" — warm editorial
        canvas: '#F4EFE6',    // ivory base, gives paper feel
        paper:  '#FAF6ED',    // lighter cream for elevated blocks
        ink:    '#1B1A17',    // deep warm black
        line:   '#1B1A17',    // borders
        muted:  '#6B6559',    // warm gray
        // keep neutral as fallback for existing components
        neutral: {
          50:  '#FAF6ED',
          100: '#F4EFE6',
          200: '#E7DFCF',
          300: '#CFC4AE',
          400: '#8F8878',
          500: '#6B6559',
          600: '#4C483F',
          700: '#33302A',
          800: '#23211C',
          900: '#1B1A17',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
