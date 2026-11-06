// Farbschema und Animationen vor dem ersten Rendern setzen, damit nichts aufblitzt (siehe src/theme/theme.ts).
// Eigene Datei statt Inline-Skript, damit die Content-Security-Policy ohne 'unsafe-inline' auskommt.
try {
  var t = localStorage.getItem('dos.theme')
  var dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  // „Animationen reduzieren“ (src/settings/motion.ts)
  if (localStorage.getItem('dos.reduceMotion') === '1')
    document.documentElement.classList.add('dos-reduce-motion')
} catch (e) {}
