/** @type {import('tailwindcss').Config} */
/* NOTE: darkMode here may be removed, but npm run dev will have to change. Ideally, this should be done.
 *       Instead of running npx from the root, run it from the theme directory. This will allow the theme to
 *       be standalone.
 */
module.exports = {
  content: ["content/**/*.md", "themes/Hugo-Theme/layouts/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
}

