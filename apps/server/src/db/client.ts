import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { fileURLToPath } from 'node:url'
import * as schema from './schema'

export type Db = ReturnType<typeof createDb>['db']

export function createDb(url: string) {
  const client = postgres(url, { max: 10, onnotice: () => {} })
  const db = drizzle(client, { schema })
  return { db, close: () => client.end() }
}

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url))

export function runMigrations(db: Db) {
  return migrate(db, { migrationsFolder })
}
