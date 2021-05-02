const colors = require('tailwindcss/colors')

module.exports = {
    purge: [],
    // purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {},
    },
    variants: {
        extend: {},
    },
    plugins: [],
    theme: {
        colors: {
             // Build your palette here
            transparent: 'transparent',
            current: 'currentColor',
            gray: colors.warmGray,
            red: colors.red,
            blue: colors.indigo,
            yellow: colors.amber,
            green: colors.emerald,
            white: "#fcfcfc",
        }
  }
}
