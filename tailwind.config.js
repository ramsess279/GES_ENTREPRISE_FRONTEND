/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: 'var(--color-primary)',
          500: 'var(--color-primary)',
          600: 'var(--color-primary)',
          700: 'var(--color-primary)',
          800: 'var(--color-primary)',
          900: 'var(--color-primary)',
          950: 'var(--color-primary)',
        },
        secondary: {
           50: 'var(--color-secondary-50, #f9fafb)',
           100: 'var(--color-secondary-100, #f3f4f6)',
           200: 'var(--color-secondary-200, #e5e7eb)',
           300: 'var(--color-secondary-300, #d1d5db)',
           400: 'var(--color-secondary-400, #9ca3af)',
           500: 'var(--color-secondary-500, #6b7280)',
           600: 'var(--color-secondary-600, #4b5563)',
           700: 'var(--color-secondary-700, #374151)',
           800: 'var(--color-secondary-800, #1f2937)',
           900: 'var(--color-secondary-900, #111827)',
           950: 'var(--color-secondary-950, #030712)',
         },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
      },
    },
  },
  plugins: [],
}