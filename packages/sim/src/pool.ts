import { Worker } from 'node:worker_threads'
import type { RunError } from './aggregate'
import type { GameResult } from './collector'
import { runGame } from './game'
import type { GameJob } from './jobs'
import type { WorkerResponse } from './worker'

export interface PoolOptions {
  workers: number
  onResult: (result: GameResult) => void
  onError: (error: RunError) => void
}

const errorText = (e: unknown) => (e instanceof Error ? (e.stack ?? e.message) : String(e))

/** Play all jobs, in this thread with one worker, otherwise on a pool of worker threads */
export async function runJobs(jobs: readonly GameJob[], opts: PoolOptions): Promise<void> {
  if (opts.workers <= 1 || jobs.length <= 1) {
    for (const job of jobs) {
      try {
        opts.onResult(runGame(job))
      } catch (e) {
        opts.onError({ jobId: job.id, error: errorText(e) })
      }
    }
    return
  }
  const queue = [...jobs]
  const size = Math.min(opts.workers, jobs.length)
  const loader = import.meta.resolve('tsx')
  await Promise.all(
    Array.from({ length: size }, () => {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), {
        execArgv: ['--import', loader],
      })
      return new Promise<void>((resolve) => {
        let current: GameJob | undefined
        const next = () => {
          current = queue.shift()
          if (!current) {
            void worker.terminate().then(() => resolve())
            return
          }
          worker.postMessage(current)
        }
        worker.on('message', (msg: WorkerResponse) => {
          if (msg.ok) opts.onResult(msg.result)
          else opts.onError({ jobId: msg.jobId, error: msg.error })
          next()
        })
        // A crashed worker fails its job; the others keep going, leftovers run inline below
        worker.on('error', (e) => {
          if (current) opts.onError({ jobId: current.id, error: errorText(e) })
          current = undefined
          void worker.terminate().then(() => resolve())
        })
        next()
      })
    }),
  )
  if (queue.length) await runJobs(queue, { ...opts, workers: 1 })
}
