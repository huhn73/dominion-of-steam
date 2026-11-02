import { Worker } from 'node:worker_threads'
import { describe, expect, it } from 'vitest'

describe('Worker', () => {
  it('lädt die Engine aus @dos/shared in einem Worker-Thread', async () => {
    const worker = new Worker(new URL('../worker-smoke.ts', import.meta.url), {
      execArgv: ['--import', 'tsx'],
    })
    const cities = await new Promise<number>((resolve, reject) => {
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.postMessage('SMOKE-1')
    })
    await worker.terminate()
    expect(cities).toBeGreaterThan(2)
  })
})
