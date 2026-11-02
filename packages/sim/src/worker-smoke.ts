// Smoke worker: proves that tsx resolves `@dos/shared` inside a worker thread
import { parentPort } from 'node:worker_threads'
import { createMatch, defaultRules } from '@dos/shared/engine'

const NOW = new Date('2026-01-01T00:00:00Z')
parentPort?.on('message', (seed: string) => {
  const state = createMatch(
    {
      id: 'smoke',
      name: 'Smoke',
      rules: defaultRules('live'),
      map: {
        width: 14,
        height: 10,
        landShare: 55,
        neutralCities: 'normal',
        terrain: 'normal',
        seed,
      },
      participants: [
        {
          id: 'p1',
          name: 'A',
          factionId: 'eisenbund',
          color: 'amber',
          isAI: true,
          aiDifficulty: 'normal',
        },
        {
          id: 'p2',
          name: 'B',
          factionId: 'aurelia',
          color: 'rose',
          isAI: true,
          aiDifficulty: 'normal',
        },
      ],
    },
    NOW,
  )
  parentPort?.postMessage(state.cities.length)
})
