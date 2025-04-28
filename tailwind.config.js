/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'twinkle': 'twinkle 8s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'pulse-attention': 'pulse-attention 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.3' },
        },
        'bounce-subtle': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-5px)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-attention': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)',
          },
          '50%': {
            transform: 'scale(1.03)',
            boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)',
          },
        },
      },
    },
  },
  plugins: [],
};
