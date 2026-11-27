// Erzeugt tailwind.css vorab (statt des Tailwind-Play-CDN im Browser).
// Neu bauen nach Klassenänderungen: npx tailwindcss@3.4.17 -c tools/tailwind.config.cjs -i tools/tailwind.in.css -o tailwind.css --minify
module.exports = {
  content: ['./index.html', './*.js'],
  safelist: [{ pattern: /^mt-(0|0\.5|1|1\.5|2|2\.5|3|4|5|6|7|8)$/ }],
  theme: { extend: {} },
  plugins: []
};
