module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#FAF8F4',
        primary: '#1E2A45',
        accent: '#F5A623',
        surface: '#FFFFFF',
        text: '#1A1A2E',
        muted: '#6B7280',
        border: '#E5E7EB',
        'on-surface': '#1A1A2E',
        'primary-container': '#E8EEF8',
        'on-primary-container': '#1E2A45',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
