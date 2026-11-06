// Sets the version of the game: `pnpm release <patch|minor|major|x.y.z>`. Writes it into the root
// package.json and every workspace package, so all of them carry the same number. Creates no tag:
// the deploy workflow tags `v<version>` and publishes the release once that version is deployed
// (deploy/README.md, „Versionen und Releases“).
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILES = [
  'package.json',
  'apps/web/package.json',
  'apps/server/package.json',
  'packages/shared/package.json',
  'packages/sim/package.json',
]
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

const read = (file) => readFileSync(path.join(root, file), 'utf8')

/** The next version for a bump keyword, or the given version itself */
export function nextVersion(current, arg) {
  const m = SEMVER.exec(current)
  if (!m) throw new Error(`Die aktuelle Version „${current}“ ist keine Version x.y.z.`)
  const [major, minor, patch] = m.slice(1).map(Number)
  if (arg === 'major') return `${major + 1}.0.0`
  if (arg === 'minor') return `${major}.${minor + 1}.0`
  if (arg === 'patch') return `${major}.${minor}.${patch + 1}`
  if (SEMVER.test(arg ?? '')) return arg
  throw new Error('Aufruf: pnpm release <patch|minor|major|x.y.z>')
}

/** Replace only the "version" value, so the rest of the file keeps its formatting */
function setVersion(text, version) {
  const field = /("version"\s*:\s*")[^"]*(")/
  if (field.test(text)) return text.replace(field, `$1${version}$2`)
  // No version yet: insert it after "name"
  return text.replace(/("name"\s*:\s*"[^"]*",\n)/, `$1  "version": "${version}",\n`)
}

const current = JSON.parse(read('package.json')).version ?? '0.0.0'
let version
try {
  version = nextVersion(current, process.argv[2])
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
for (const file of FILES) writeFileSync(path.join(root, file), setVersion(read(file), version))
console.log(`Version ${current} → ${version}`)
console.log('Nächste Schritte:')
console.log(
  `  Neuigkeiten für ${version} in packages/shared/src/news/index.ts eintragen (Test verlangt es)`,
)
console.log(`  git commit -am "Version ${version}"`)
console.log('  git push origin main:dev')
console.log(
  `  Beim Deploy auf main entstehen Tag v${version}, Image v${version} und das GitHub-Release.`,
)
