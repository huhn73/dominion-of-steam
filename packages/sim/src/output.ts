import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

export function createRunDir(base: string, name: string, now = new Date()) {
  const dir = join(base, `${stamp(now)}-${name}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** One JSON document per line, appended as soon as a game is done */
export class JsonlWriter {
  constructor(readonly path: string) {
    writeFileSync(path, '')
  }
  write(doc: unknown) {
    appendFileSync(this.path, JSON.stringify(doc) + '\n')
  }
}

export function writeJson(path: string, doc: unknown) {
  writeFileSync(path, JSON.stringify(doc, null, 2) + '\n')
}

export function writeText(path: string, text: string) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, text)
}
