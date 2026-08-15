/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        'primary-hover': '#FF8C5A',
        secondary: '#FFFFFF',
        tertiary: '#1A1A1A',
        border: '#333333',
        disabled: '#666666',
        success: '#4CAF50',
        danger: '#F44336',
      },
    },
  },
  plugins: [],
}
