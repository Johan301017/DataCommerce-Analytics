/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        primary: { DEFAULT: '#2563EB', light: '#DBEAFE', dark: '#1D4ED8' },
        success: { DEFAULT: '#10B981', light: '#D1FAE5' },
        surface: '#F8FAFC',
        ink: '#1E293B',
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { 'fade-up': 'fadeUp 0.35s ease-out both' },
    },
  },
  plugins: [],
};
