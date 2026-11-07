// Bundles the server for the production image: dist/index.js (server) and dist/worker.js (AI
// worker thread). @dos/shared is plain TypeScript and goes into the bundle; the npm
// dependencies stay external and come from node_modules (production install in the image).
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const external = Object.keys(pkg.dependencies).filter((name) => !name.startsWith('@dos/'))

await build({
  entryPoints: { index: 'src/index.ts', worker: 'src/ai/worker.ts' },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  // Subpaths such as drizzle-orm/postgres-js stay external too
  external: external.flatMap((name) => [name, `${name}/*`]),
  // Bundled CommonJS code may call require()
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: 'info',
})
