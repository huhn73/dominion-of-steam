import { readFileSync, existsSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { aggregate, type RunError, type RunMeta } from './aggregate'
import type { GameResult } from './collector'
import { ConfigError, parseConfig, type SimConfig } from './config'
import { runGame } from './game'
import { expandJobs } from './jobs'
import { createRunDir, JsonlWriter, writeJson, writeText } from './output'
import { runJobs } from './pool'
import { pct, renderReport } from './report'
import { stamp } from './output'
import { catalogSweepMatchups, sweepMatchups } from './sweep'
import { mapStats, renderMapStats } from './mapstats'
import { describeCatalog } from './catalogOverride'
import { MAP_SIZES, type MapSizeId } from '@dos/shared/game/mapSizes'
import { isWorldShape } from '@dos/shared/game/worldShapes'

const PKG_DIR = fileURLToPath(new URL('..', import.meta.url))
const REPO_DIR = resolve(PKG_DIR, '..', '..')
const DEFAULT_OUT = join(PKG_DIR, 'results')
const DEFAULT_REPORTS = join(REPO_DIR, 'agent-os', 'product', 'ki-simulation')

const USAGE = `Aufruf: pnpm sim [run|sweep|bench] --config <datei.json> [Optionen]

  run     Matchups der Config spielen (Vorgabe)
  sweep   Raster aus config.sweep spielen: KI-Profil (grid) gegen die Referenz oder
          Katalogwerte (catalogGrid) mit allen Matchups der Config
  bench   drei Partien im Hauptthread messen (ms je Runde, Befehle je Zug, Spielstandsgröße)
  maps    Welten erzeugen und vermessen: Hauptstädte getrennt und an der Küste, Heimatinseln, Städte
          --shape continent|islands|archipelago  --sizes small,medium  --shares 20,35,50  --seats 2,4,6  --seeds 20

Optionen:
  --config <datei>      Konfiguration (relativ zum Aufrufordner oder zum Repo)
  --seeds <n>           Anzahl Seeds überschreiben
  --workers <n>         Worker-Threads (Vorgabe: Kerne, höchstens Jobs)
  --out <ordner>        Rohdaten (Vorgabe packages/sim/results/)
  --report-dir <ordner> Markdown-Bericht (Vorgabe agent-os/product/ki-simulation/)
  --no-report           keinen Bericht schreiben
  --dry-run             nur Jobanzahl und Schätzung ausgeben
  --ms-per-round <n>    Annahme für die Schätzung (Vorgabe 30, Bench: 8–25 auf Mittel)
`

const BENCH_CONFIG = {
  name: 'bench',
  matchups: [
    {
      id: 'bench',
      participants: [
        { label: 'normal-eisenbund', factionId: 'eisenbund', difficulty: 'normal' },
        { label: 'normal-aurelia', factionId: 'aurelia', difficulty: 'normal' },
        { label: 'hard-nordmark', factionId: 'nordmark', difficulty: 'hard' },
      ],
    },
  ],
  maps: [{ size: 'medium' }],
  seeds: 3,
  rotateSeats: false,
  roundLimit: 100,
}

function loadConfig(path: string | undefined): SimConfig {
  if (!path) return parseConfig(BENCH_CONFIG)
  const candidates = [path, join(REPO_DIR, path), join(PKG_DIR, 'configs', path)].map((p) =>
    isAbsolute(p) ? p : resolve(p),
  )
  const file = candidates.find((p) => existsSync(p))
  if (!file) throw new ConfigError(`Konfiguration nicht gefunden: ${path}`)
  return parseConfig(JSON.parse(readFileSync(file, 'utf8')), file)
}

const de = (x: number, digits = 1) => x.toFixed(digits).replace('.', ',')
const fmtDuration = (ms: number) => {
  const s = Math.round(ms / 1000)
  if (s < 90) return `${s} s`
  const m = Math.round(s / 60)
  return m < 120 ? `${m} min` : `${de(m / 60, 1)} h`
}

class Progress {
  private done = 0
  private readonly start = performance.now()
  private readonly tty = process.stderr.isTTY
  constructor(private readonly total: number) {}
  tick(last: string) {
    this.done++
    const elapsed = performance.now() - this.start
    const perMin = (this.done / elapsed) * 60_000
    const rest = ((this.total - this.done) * elapsed) / this.done
    const line = `gespielt ${this.done}/${this.total} · ${de(perMin, 1)} Partien/min · Rest ≈ ${fmtDuration(rest)} · ${last}`
    if (this.tty) process.stderr.write(`\r${line.padEnd(120)}`)
    else if (this.done % 10 === 0 || this.done === this.total) process.stderr.write(line + '\n')
  }
  end() {
    if (this.tty) process.stderr.write('\n')
  }
}

function bench(config: SimConfig) {
  const jobs = expandJobs(config).slice(0, 3)
  console.log(
    `Bench: ${jobs.length} Partien im Hauptthread, ${config.matchups[0]!.participants.length} KIs, Karte ${jobs[0]!.mapId}, Rundenlimit ${config.roundLimit}`,
  )
  for (const job of jobs) {
    const sizes: string[] = []
    const t0 = performance.now()
    const r = runGame(job, {
      onRound: (s) => {
        if (sizes.at(-1)?.startsWith(`R${s.round}:`)) return
        if (s.round % 20 === 0 || s.status === 'finished')
          sizes.push(
            `R${s.round}: ${de(JSON.stringify(s).length / 1024, 0)} KiB, ${s.units.length} Einheiten, ${s.events.length} Ereignisse`,
          )
      },
    })
    const ms = performance.now() - t0
    const turns = r.participants.reduce((a, p) => a + p.turns.count, 0)
    const turnMs = r.participants.reduce((a, p) => a + p.turns.totalMs, 0)
    const commands = r.participants.reduce((a, p) => a + p.turns.commands, 0)
    const maxTurn = Math.max(...r.participants.map((p) => p.turns.maxMs))
    console.log(
      `\n${job.seed}: ${r.rounds} Runden in ${fmtDuration(ms)} (${de(ms / r.rounds, 0)} ms/Runde), ` +
        `${de(turnMs / turns, 1)} ms je KI-Zug, ${de(commands / turns, 1)} Befehle je Zug, längster Zug ${de(maxTurn, 0)} ms, ` +
        `Sieger ${r.winnerLabel ?? '–'} (${r.victoryType})`,
    )
    for (const line of sizes) console.log(`  ${line}`)
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      config: { type: 'string' },
      seeds: { type: 'string' },
      workers: { type: 'string' },
      out: { type: 'string' },
      'report-dir': { type: 'string' },
      'no-report': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      'ms-per-round': { type: 'string' },
      shape: { type: 'string' },
      sizes: { type: 'string' },
      shares: { type: 'string' },
      seats: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (values.help) return console.log(USAGE)
  const mode = (positionals[0] ?? 'run') as 'run' | 'sweep' | 'bench' | 'maps'
  if (!['run', 'sweep', 'bench', 'maps'].includes(mode))
    throw new ConfigError(`unbekannter Modus "${mode}"\n\n${USAGE}`)
  if (mode === 'maps') {
    const shape = values.shape ?? 'islands'
    if (!isWorldShape(shape)) throw new ConfigError(`unbekannte Weltform "${shape}"`)
    const list = (v: string | undefined, fallback: string) =>
      (v ?? fallback).split(',').map((x) => x.trim())
    const sizes = list(values.sizes, 'small,medium') as MapSizeId[]
    for (const s of sizes)
      if (!(s in MAP_SIZES)) throw new ConfigError(`unbekannte Kartengröße "${s}"`)
    const rows = mapStats({
      shape,
      sizes,
      shares: list(values.shares, '20,35,50').map(Number),
      seats: list(values.seats, '2,4,6').map(Number),
      seeds: Number(values.seeds ?? 20),
    })
    console.log(renderMapStats(shape, rows))
    return
  }

  let config = loadConfig(values.config)
  if (values.seeds) config = { ...config, seeds: Number(values.seeds) }
  if (mode === 'bench') return bench(config)
  if (mode === 'sweep') {
    if (!config.sweep)
      throw new ConfigError('sweep: die Konfiguration hat keinen Abschnitt "sweep"')
    config = {
      ...config,
      matchups:
        config.sweep.kind === 'profile'
          ? sweepMatchups(config.sweep)
          : catalogSweepMatchups(config.sweep, config.matchups),
    }
  }
  const jobs = expandJobs(config)
  const workers = Math.max(
    1,
    Math.min(Number(values.workers ?? config.workers ?? availableParallelism()), jobs.length),
  )
  const msPerRound = Number(values['ms-per-round'] ?? 30)
  const estimate = (jobs.length * config.roundLimit * msPerRound) / workers
  console.log(
    `${config.name}: ${config.matchups.length} Matchups, ${config.maps.length} Karten, ${jobs.length} Partien, ${workers} Worker. ` +
      `Schätzung bei ${msPerRound} ms/Runde und vollem Rundenlimit: ${fmtDuration(estimate)}.`,
  )
  if (values['dry-run']) return
  if (jobs.length > 2000)
    console.warn(`Achtung: ${jobs.length} Partien, das dauert. Abbruch mit Strg+C.`)

  const startedAt = new Date()
  const dir = createRunDir(values.out ?? DEFAULT_OUT, config.name, startedAt)
  const games = new JsonlWriter(join(dir, 'games.jsonl'))
  const results: GameResult[] = []
  const errors: RunError[] = []
  const progress = new Progress(jobs.length)
  await runJobs(jobs, {
    workers,
    onResult: (r) => {
      results.push(r)
      games.write(r)
      progress.tick(
        `${r.matchupId} ${r.seed} r${r.rotation}: ${r.rounds} Runden, ${r.winnerLabel ?? 'unentschieden'} (${fmtDuration(r.durationMs)})`,
      )
    },
    onError: (e) => {
      errors.push(e)
      progress.tick(`${e.jobId}: FEHLER`)
      console.error(`\n${e.jobId}: ${e.error}`)
    },
  })
  progress.end()
  const meta: RunMeta = {
    mode,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    workers,
    jobs: jobs.length,
  }
  const summary = aggregate(config, results, errors, meta)
  writeJson(join(dir, 'summary.json'), summary)
  console.log(`Rohdaten: ${dir}`)
  if (!values['no-report']) {
    const report = join(
      values['report-dir'] ?? DEFAULT_REPORTS,
      `${stamp(startedAt)}-${config.name}.md`,
    )
    writeText(report, renderReport(summary))
    console.log(`Bericht: ${report}`)
  }
  for (const m of summary.matchups) {
    const line = m.labels.map((l) => `${l.label} ${pct(l.winRate)}`).join(' · ')
    console.log(`${m.matchupId}: ${line} (Median ${de(m.medianRounds, 0)} Runden)`)
  }
  if (summary.sweep?.length) {
    const best = summary.sweep[0]!
    console.log(`Sweep: bester Rasterpunkt ${JSON.stringify(best.params)} mit ${pct(best.winRate)}`)
  }
  if (summary.catalogSweep?.length) {
    const best = summary.catalogSweep[0]!
    console.log(
      `Katalog-Sweep: bester Rasterpunkt ${describeCatalog(best.params)}, größte Abweichung ${de(best.maxDeviation * 100, 1)} Punkte`,
    )
  }
}

main().catch((e) => {
  if (e instanceof ConfigError) {
    console.error(`Konfiguration: ${e.message}`)
    process.exit(2)
  }
  console.error(e)
  process.exit(1)
})
