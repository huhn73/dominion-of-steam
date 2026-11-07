import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The server folder `apps/server/`. This module lies one level below it both as source
 * (`src/paths.ts`) and in the bundle (`dist/index.js`, where every module shares one URL),
 * so paths from here stay correct in both.
 */
export const serverDir = fileURLToPath(new URL('..', import.meta.url))

/** A path below `apps/server/` */
export const serverPath = (...parts: string[]) => join(serverDir, ...parts)
