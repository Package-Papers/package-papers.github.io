/** @type {import('tailwindcss').Config} */
/* NOTE: darkMode here may be removed, but npm run dev will have to change. Ideally, this should be done.
 *       Instead of running npx from the root, run it from the theme directory. This will allow the theme to
 *       be standalone.
 */
module.exports = {
  content: [
    "content/**/*.md", 
    "themes/Hugo-Theme/layouts/**/*.html",
    "themes/Hugo-Theme/assets/**/*.js"
  ],
  darkMode: "class",
  theme: {

    extend: {
      fontFamily: {
        sans: ['Inter'],
      },
      boxShadow: {
        'top-highlight': 'inset 0 1px 0 rgba(256, 256, 256, 0.1)'
      },
      spacing: {
        'nav-bar-icon-padding': '0.3rem'

      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

