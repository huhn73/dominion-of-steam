import { createDb, runMigrations } from './db/client'

const { db, close } = createDb(process.env.DATABASE_URL!)
await runMigrations(db)
await close()
console.log('Migrationen ausgeführt')
