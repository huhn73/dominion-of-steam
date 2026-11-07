import { UNIT_TYPES } from '@dos/shared/game/catalog'
import type { LabelSummary, MatchupSummary, RunSummary } from './aggregate'
import { mapId } from './jobs'
import { describeParams } from './sweep'
import { describeCatalog } from './catalogOverride'

const de = (x: number, digits = 1) => x.toFixed(digits).replace('.', ',')
export const pct = (x: number, digits = 0) => `${de(x * 100, digits)} %`
const interval = ([lo, hi]: [number, number]) => `${de(lo * 100, 0)}–${de(hi * 100, 0)} %`
const opt = (x: number | null, digits = 1) => (x == null ? '–' : de(x, digits))
const ms = (x: number) => (x >= 1000 ? `${de(x / 1000, 1)} s` : `${de(x, 0)} ms`)
const duration = (x: number) => {
  const s = Math.round(x / 1000)
  if (s < 90) return `${s} s`
  const m = Math.floor(s / 60)
  return m < 90 ? `${m} min ${s % 60} s` : `${de(m / 60, 1)} h`
}
const unitName = (id: string) => UNIT_TYPES.find((t) => t.id === id)?.name ?? id

function table(header: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n')
}

const VICTORY_NAMES: Record<string, string> = {
  elimination: 'Ausschaltung',
  capitulation: 'Kapitulation',
  capitals: 'Hauptstädte',
  dominance: 'Vorherrschaft',
  roundLimit: 'Rundenlimit',
  aborted: 'Abbruch (Rundendeckel)',
}

function labelName(l: LabelSummary) {
  const extra = [l.factionId, l.difficulty, l.personalityId].filter(Boolean).join(', ')
  return `**${l.label}** (${extra})`
}

function matchupSection(m: MatchupSummary, title: string): string {
  const out: string[] = [`## ${title}`, '']
  if (m.sweepParams) out.push(`Rasterpunkt: ${describeParams(m.sweepParams)}`, '')
  if (m.catalogParams) out.push(`Katalog: ${describeCatalog(m.catalogParams)}`, '')
  const victory = Object.entries(m.victoryTypes)
    .map(([k, v]) => `${VICTORY_NAMES[k] ?? k} ${v}`)
    .join(', ')
  out.push(
    `${m.games} Partien, Median ${de(m.medianRounds, 0)} Runden (Mittel ${de(m.meanRounds, 1)}). Spielende: ${victory}.`,
    '',
  )
  out.push(
    table(
      [
        'Teilnehmer',
        'Siege',
        'Quote',
        '95 %-Intervall',
        'Ø Platz',
        'Ausgeschieden',
        'Ø 1. Eroberung',
        'Ø Städte',
        'Ø Einheiten',
        'Ø Zug',
        'p95 Zug',
      ],
      m.labels.map((l) => [
        labelName(l),
        `${l.wins}/${l.games}`,
        pct(l.winRate),
        interval(l.wilson),
        opt(l.avgPlacement, 2),
        l.eliminated ? `${l.eliminated} (Median R${de(l.medianEliminationRound ?? 0, 0)})` : '0',
        l.avgFirstCaptureRound == null
          ? '–'
          : `R${de(l.avgFirstCaptureRound, 1)} (${l.capturedAny}/${l.games})`,
        de(l.avgFinalCities, 1),
        de(l.avgFinalUnits, 1),
        ms(l.turns.avgMs),
        ms(l.turns.p95Ms),
      ]),
    ),
    '',
  )
  if (m.byMap.length > 1) {
    out.push('**Spielende je Karte**', '')
    out.push(
      table(
        ['Karte', 'Partien', 'entschieden', 'Ø Ende', 'Spielende', 'Siege'],
        m.byMap.map((x) => [
          x.mapId,
          String(x.games),
          pct(x.decided),
          `R${de(x.meanRounds, 0)}`,
          Object.entries(x.victoryTypes)
            .map(([k, v]) => `${VICTORY_NAMES[k] ?? k} ${v}`)
            .join(', '),
          m.labels.map((l) => `${l.label} ${x.wins[l.label] ?? 0}`).join(' : '),
        ]),
      ),
      '',
    )
  }
  out.push(
    '**Sitzvorteil** (Siegquote je Sitz): ' +
      m.bySeat.map((s) => `Sitz ${s.seat + 1} ${pct(s.winRate)}`).join(' · '),
    '',
  )
  out.push('**Kämpfe und Eroberungen je Partie**', '')
  out.push(
    table(
      [
        'Teilnehmer',
        'Angriffe',
        'gewonnen',
        'Stadtangriffe',
        'erobert neutral',
        'erobert feindlich',
        'Städte verloren',
        'Einheiten verloren',
        'vernichtet',
        'sonstige Verluste',
        'Schaden +/−',
        'Mehrfachangriffe',
        'Verluste vor Städten',
      ],
      m.labels.map((l) => [
        l.label,
        de(l.combat.attacks, 1),
        l.attackWinRate == null ? '–' : pct(l.attackWinRate),
        `${de(l.combat.cityAttacks, 1)} (${de(l.combat.cityAttacksWon, 1)} erfolgreich)`,
        de(l.avgCaptures.neutral, 1),
        de(l.avgCaptures.enemy, 1),
        de(l.avgCaptures.lost, 1),
        de(l.combat.unitsLost, 1),
        de(l.combat.unitsKilled, 1),
        de(l.combat.otherLosses, 1),
        `${de(l.combat.damageDealt, 1)} / ${de(l.combat.damageTaken, 1)}`,
        `${de(l.combat.focusTargets, 1)} (${de(l.combat.focusWon, 1)} gefallen)`,
        de(l.combat.lostNearCities, 1),
      ]),
    ),
    '',
  )
  if (m.labels.some((l) => l.naval.loadedTurns > 0)) {
    out.push('**Seetransporte je Partie**', '')
    out.push(
      table(
        ['Teilnehmer', 'Landungen', 'Züge beladen', 'davon wartend', 'neutral über See erobert'],
        m.labels.map((l) => [
          l.label,
          de(l.naval.landings, 1),
          de(l.naval.loadedTurns, 1),
          l.naval.loadedTurns
            ? `${de(l.naval.loadedIdle, 1)} (${pct(l.naval.loadedIdle / l.naval.loadedTurns)})`
            : '–',
          de(l.naval.overseasNeutral, 1),
        ]),
      ),
      '',
    )
  }
  const types = [...new Set(m.labels.flatMap((l) => Object.keys(l.production)))].sort()
  if (types.length) {
    out.push('**Produktion je Partie** (fertiggestellte Einheiten)', '')
    out.push(
      table(
        ['Teilnehmer', ...types.map(unitName), 'Befehle/Zug', 'Budget erschöpft'],
        m.labels.map((l) => [
          l.label,
          ...types.map((t) => de(l.production[t] ?? 0, 1)),
          de(l.turns.avgCommands, 1),
          String(l.turns.budgetExhausted),
        ]),
      ),
      '',
    )
  }
  const maxRound = Math.max(0, ...m.labels.map((l) => l.curve.length))
  if (maxRound > 0) {
    const samples = [
      ...new Set([
        ...Array.from({ length: Math.floor(maxRound / 10) }, (_, i) => (i + 1) * 10),
        maxRound,
      ]),
    ].filter((r) => r >= 1 && r <= maxRound)
    out.push('**Verlauf** (Mittel über alle Partien, Städte / Einheiten)', '')
    out.push(
      table(
        ['Runde', ...m.labels.map((l) => l.label)],
        samples.map((r) => [
          String(r),
          ...m.labels.map((l) => {
            const p = l.curve[r - 1]!
            return `${de(p.cities, 1)} / ${de(p.units, 1)}`
          }),
        ]),
      ),
      '',
    )
  }
  return out.join('\n')
}

export function renderReport(s: RunSummary): string {
  const out: string[] = []
  out.push(`# KI-Simulation: ${s.name}`, '')
  out.push(
    `Lauf vom ${new Date(s.startedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}, Modus \`${s.mode}\`. ` +
      `${s.played} Partien gespielt${s.failed ? `, ${s.failed} fehlgeschlagen` : ''}, ${s.workers} Worker, Dauer ${duration(s.wallMs)}.`,
    '',
  )
  const maps = s.config.maps
    .map(
      (m) =>
        `${mapId(m)} (Welt ${m.worldShape}, Land ${m.landShare} %, Städte ${m.neutralCities}, Gelände ${m.terrain})`,
    )
    .join('; ')
  const seeds = Array.isArray(s.config.seeds) ? s.config.seeds.length : s.config.seeds
  out.push(
    `Karten: ${maps}. Seeds je Matchup und Karte: ${seeds}${s.config.rotateSeats ? ', Sitzreihenfolge rotiert' : ''}. ` +
      `Rundenlimit ${s.config.roundLimit}, Siegbedingung ${VICTORY_NAMES[s.config.victoryCondition] ?? s.config.victoryCondition}.`,
    '',
  )
  if (s.config.catalog && Object.keys(s.config.catalog).length)
    out.push(`Katalogwerte für alle Partien: ${describeCatalog(s.config.catalog)}.`, '')
  out.push('**Laufzeit der Engine**', '')
  out.push(
    table(
      ['Ø Partie', 'Ø Runden', 'ms je Runde', 'ms je KI-Zug', 'Befehle je KI-Zug'],
      [
        [
          duration(s.avgGameMs),
          de(s.avgRounds, 1),
          de(s.msPerRound, 1),
          de(s.msPerAiTurn, 1),
          de(s.avgCommandsPerTurn, 1),
        ],
      ],
    ),
    '',
  )
  if (s.catalogSweep?.length) {
    out.push('## Katalog-Sweep', '')
    out.push(
      'Jeder Rasterpunkt spielt alle Matchups der Config mit diesen Werten. Sortiert nach der größten Abweichung einer Siegquote vom gleichen Anteil (1 / Sitze) über alle Zellen (Matchup × Karte), dann nach der mittleren.',
      '',
    )
    const cells = s.catalogSweep[0]!.cells.map((c) => `${c.matchupId} · ${c.mapId}`)
    out.push(
      table(
        ['Rang', 'Rasterpunkt', 'Partien', 'größte Abw.', 'mittlere Abw.'],
        s.catalogSweep.map((r) => [
          String(r.rank),
          r.baseline ? '**Basis**' : describeCatalog(r.params),
          r.games,
          `${de(r.maxDeviation * 100, 1)} Pkt.`,
          `${de(r.meanDeviation * 100, 1)} Pkt.`,
        ]),
      ),
      '',
    )
    out.push('**Siegquoten je Zelle**', '')
    const labels = [
      ...new Set(s.catalogSweep.flatMap((r) => r.cells.flatMap((c) => Object.keys(c.rates)))),
    ]
    for (const cell of cells) {
      out.push(`*${cell}*`, '')
      out.push(
        table(
          ['Rang', ...labels],
          s.catalogSweep.map((r) => {
            const c = r.cells.find((x) => `${x.matchupId} · ${x.mapId}` === cell)
            return [
              String(r.rank),
              ...labels.map((l) => (c && l in c.rates ? pct(c.rates[l]!) : '–')),
            ]
          }),
        ),
        '',
      )
    }
  }
  if (s.sweep?.length && s.config.sweep?.kind === 'profile') {
    const subject = s.config.sweep.subject.label
    const reference = s.config.sweep.reference.label
    out.push(`## Sweep: ${subject} gegen ${reference}`, '')
    out.push(
      table(
        ['Rang', 'Rasterpunkt', 'Siege', 'Quote', '95 %-Intervall', 'Ø Platz'],
        s.sweep.map((r) => [
          String(r.rank),
          r.baseline ? '**Basis (ohne Override)**' : describeParams(r.params),
          `${r.wins}/${r.games}`,
          pct(r.winRate),
          interval(r.wilson),
          opt(r.avgPlacement, 2),
        ]),
      ),
      '',
    )
  }
  for (const m of s.matchups) out.push(matchupSection(m, `Matchup ${m.matchupId}`), '')
  if (s.errors.length) {
    out.push('## Fehlgeschlagene Partien', '')
    for (const e of s.errors) out.push(`- \`${e.jobId}\`: ${e.error}`)
    out.push('')
  }
  out.push('## Lesehinweise', '')
  out.push(
    '- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.',
    '- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.',
    '- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.',
    '- „Entschieden“ heißt vor dem Rundenlimit beendet. „Davon wartend“ zählt Züge, die ein beladener Frachter mit derselben Ladung auf demselben Feld beendet wie im Zug davor.',
    '- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.',
    `- Rohdaten (\`games.jsonl\`, \`summary.json\`) liegen im Laufordner unter \`packages/sim/results/\`.`,
    '',
  )
  return out.join('\n')
}
