import { parentPort } from 'node:worker_threads'
import { type AiJob, playJob } from './play'

// Worker thread of the AI runner: one job in, the state after the AI's moves (or an error) out
parentPort?.on('message', (job: AiJob) => {
  parentPort?.postMessage(playJob(job))
})
