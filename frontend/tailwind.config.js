/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0D1117',
        surface: '#161B22',
        elevated: '#21262D',
        border: '#30363D',
        primary: '#E6EDF3',
        muted: '#8B949E',
        accent: '#58A6FF',
        success: '#3FB950',
        warning: '#D29922',
        danger: '#F85149',
        critical: '#FF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
