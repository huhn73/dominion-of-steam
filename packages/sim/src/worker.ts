import { parentPort } from 'node:worker_threads'
import type { GameResult } from './collector'
import { runGame } from './game'
import type { GameJob } from './jobs'

export type WorkerResponse =
  { ok: true; result: GameResult } | { ok: false; jobId: string; error: string }

parentPort?.on('message', (job: GameJob) => {
  let response: WorkerResponse
  try {
    response = { ok: true, result: runGame(job) }
  } catch (e) {
    response = {
      ok: false,
      jobId: job.id,
      error: e instanceof Error ? (e.stack ?? e.message) : String(e),
    }
  }
  parentPort?.postMessage(response)
})
