import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#F6F1E7', soft: '#FBF8F1', deep: '#EFE7D6' },
        ink: { DEFAULT: '#1E2A2B', soft: '#3A4A4B', mute: '#6B7A7A' },
        teal: { DEFAULT: '#2F6F6A', deep: '#1F4E4B', soft: '#5C9A94' },
        coral: { DEFAULT: '#E86A55', deep: '#C64F3C', soft: '#F2A596' },
        amber: { DEFAULT: '#D98A2B', soft: '#F0C88C' },
        sage: { DEFAULT: '#8FA88A', soft: '#CBD6C2' },
        line: '#E3DACB',
        card: '#FFFFFF',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      boxShadow: {
        soft: '0 8px 24px -12px rgba(30,42,43,.18)',
        lift: '0 18px 40px -20px rgba(30,42,43,.28)',
      },
      keyframes: {
        'breathe-in': { '0%': { transform: 'scale(.7)' }, '100%': { transform: 'scale(1)' } },
        'breathe-out': { '0%': { transform: 'scale(1)' }, '100%': { transform: 'scale(.7)' } },
      },
      animation: {
        'breathe-in': 'breathe-in 4s ease-in-out forwards',
        'breathe-out': 'breathe-out 4s ease-in-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
