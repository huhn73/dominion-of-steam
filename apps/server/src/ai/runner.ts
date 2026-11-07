import { availableParallelism } from 'node:os'
import { Worker } from 'node:worker_threads'
import { eq } from 'drizzle-orm'
import {
  currentParticipant,
  endIfNoHumans,
  type GameState,
  normalizeState,
} from '@dos/shared/engine'
import type { Db } from '../db/client'
import { matches } from '../db/schema'
import { saveMatch } from '../matches/repository'
import { finishTurn } from '../matches/service'
import { turnNotifications } from '../notifications/events'
import type { Notifier } from '../notifications/service'
import { signalMatch } from '../realtime/signals'
import { AI_TURN_BUDGET_MS, type AiJob, type AiResult, errorText, playJob } from './play'

/** A worker that has not answered after this long is stopped; the AI then just ends its turn */
export const AI_WORKER_TIMEOUT_MS = 6 * AI_TURN_BUDGET_MS

export interface AiRunnerOptions {
  notifier?: Notifier
  /** Worker threads (matches computed at the same time); default min(2, cores - 1), at least 1 */
  workers?: number
  /** Compute in this thread without workers (tests) */
  inline?: boolean
  /** Replaces the computation (tests: failures, changes while the AI computes) */
  play?: (job: AiJob) => Promise<AiResult>
  /** The player is in the app right now: no "yourTurn" when the AIs hand the turn back */
  isConnected?: (playerId: string) => boolean
  log?: (msg: string, err?: unknown) => void
}

export function defaultAiWorkers() {
  const env = Number(process.env.AI_WORKERS)
  if (Number.isInteger(env) && env > 0) return env
  return Math.max(1, Math.min(2, availableParallelism() - 1))
}

/**
 * Plays the turns of AI participants in the background, one turn per step: the match is read
 * without a lock, the AI computes in a worker thread, and the result is saved under the row
 * lock only if the match has not changed meanwhile (`version`). After each AI turn the
 * participants get a signal. Matches waiting for an AI carry `ai_pending`, so `recover()`
 * picks them up again after a restart.
 */
export function createAiRunner(db: Db, opts: AiRunnerOptions = {}) {
  const log = opts.log ?? ((msg, err) => console.error(msg, err))
  const inline = opts.inline ?? false
  const capacity = inline ? 1 : (opts.workers ?? defaultAiWorkers())
  const queue: string[] = []
  const queued = new Set<string>()
  const active = new Set<string>()
  const idleWorkers: Worker[] = []
  const allWorkers = new Set<Worker>()
  let idleWaiters: (() => void)[] = []
  let closed = false

  function spawn() {
    // From source the worker runs through tsx; in the bundle (dist/index.js) it is dist/worker.js
    const worker = import.meta.url.endsWith('.ts')
      ? new Worker(new URL('./worker.ts', import.meta.url), {
          execArgv: ['--import', import.meta.resolve('tsx')],
        })
      : new Worker(new URL('./worker.js', import.meta.url))
    worker.unref()
    allWorkers.add(worker)
    worker.once('exit', () => allWorkers.delete(worker))
    return worker
  }

  function compute(job: AiJob): Promise<AiResult> {
    if (opts.play) return opts.play(job)
    if (inline) return Promise.resolve(playJob(job))
    const worker = idleWorkers.pop() ?? spawn()
    return new Promise((resolve) => {
      let done = false
      const finish = (result: AiResult, reuse: boolean) => {
        if (done) return
        done = true
        clearTimeout(timer)
        worker.off('message', onMessage)
        worker.off('error', onError)
        worker.off('exit', onExit)
        if (reuse && !closed) idleWorkers.push(worker)
        else void worker.terminate()
        resolve(result)
      }
      const onMessage = (result: AiResult) => finish(result, true)
      const onError = (e: unknown) => finish({ ok: false, error: errorText(e) }, false)
      const onExit = (code: number) =>
        finish({ ok: false, error: `KI-Worker beendet (Code ${code})` }, false)
      const timer = setTimeout(
        () => finish({ ok: false, error: 'KI-Worker antwortet nicht' }, false),
        AI_WORKER_TIMEOUT_MS,
      )
      worker.on('message', onMessage)
      worker.once('error', onError)
      worker.once('exit', onExit)
      worker.postMessage(job)
    })
  }

  /** Play the turn of the AI on the move; returns true when another AI step is due */
  async function step(matchId: string): Promise<boolean> {
    const [row] = await db
      .select({ state: matches.state, version: matches.version })
      .from(matches)
      .where(eq(matches.id, matchId))
    if (!row?.state) return false
    const before = normalizeState(row.state)
    if (before.status !== 'running') return false
    const now = new Date()

    // Without humans nobody would ever stop the AIs: the match ends by points
    let after: GameState = structuredClone(before)
    const ended = endIfNoHumans(after, now)
    if (!ended) {
      const ai = currentParticipant(before)
      if (!ai.isAI) return false
      const result = await compute({ state: before, aiId: ai.id, now: now.toISOString() })
      // Shutting down (worker stopped): nothing is saved, `recover()` plays the turn later
      if (closed) return false
      // A bug in the AI must not block the match: the AI then just ends its turn
      if (result.ok) after = result.state
      else log(`KI-Zug von ${ai.name} (${matchId}) fehlgeschlagen`, result.error)
    }

    const next = await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ version: matches.version })
        .from(matches)
        .where(eq(matches.id, matchId))
        .for('update')
      // Changed meanwhile (surrender, deadline, …): discard and compute again from the new state
      if (!locked || locked.version !== row.version) return null
      const saved = ended ? after : await finishTurn(tx, after, now)
      await saveMatch(tx, saved)
      const current = saved.status === 'running' ? currentParticipant(saved) : null
      const watching = current && !current.isAI && opts.isConnected?.(current.id)
      await opts.notifier?.enqueue(
        tx,
        turnNotifications(before, saved, { actorId: watching ? current.id : null }),
        now,
      )
      await signalMatch(tx, saved)
      return saved
    })
    opts.notifier?.kick()
    if (!next) return true
    return next.status === 'running' && currentParticipant(next).isAI
  }

  function settleIdle() {
    if (queue.length || active.size) return
    const waiters = idleWaiters
    idleWaiters = []
    for (const w of waiters) w()
  }

  function pump() {
    while (!closed && active.size < capacity) {
      const i = queue.findIndex((id) => !active.has(id))
      if (i < 0) break
      const [id] = queue.splice(i, 1) as [string]
      queued.delete(id)
      active.add(id)
      step(id)
        .catch((err) => {
          log(`KI-Züge in ${id} fehlgeschlagen`, err)
          return false
        })
        .then((again) => {
          active.delete(id)
          // The same match comes next, so its AIs move one after another without a gap
          if (again) schedule(id, { front: true })
          pump()
          settleIdle()
        })
    }
    settleIdle()
  }

  /** Queue a match whose AI may be on the move (no-op when already queued) */
  function schedule(matchId: string, { front = false } = {}) {
    if (closed || queued.has(matchId)) return
    queued.add(matchId)
    if (front) queue.unshift(matchId)
    else queue.push(matchId)
    pump()
  }

  /** Queue every match waiting for an AI (start-up and each sweep) */
  async function recover() {
    const rows = await db
      .select({ id: matches.id })
      .from(matches)
      .where(eq(matches.aiPending, true))
    for (const { id } of rows) if (!active.has(id)) schedule(id)
    return rows.length
  }

  /** Resolves once no AI step is queued or running (tests) */
  function idle() {
    if (!queue.length && !active.size) return Promise.resolve()
    return new Promise<void>((resolve) => idleWaiters.push(resolve))
  }

  /** Stop: nothing new starts, running workers are stopped, a step in flight still settles */
  async function close() {
    closed = true
    queue.length = 0
    queued.clear()
    await Promise.all([...allWorkers].map((w) => w.terminate()))
    await idle()
  }

  return { schedule, recover, idle, close, busy: () => active.size + queue.length }
}

export type AiRunner = ReturnType<typeof createAiRunner>
