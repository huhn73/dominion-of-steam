import { readFileSync } from 'node:fs'
import { versionOf } from '@dos/shared/news'

/** Version from the root package.json, shown with „-dev“ when the image build set none */
export const packageVersion = (
  JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {
    version: string
  }
).version

/** The running version as x.y.z: the image's `APP_VERSION`, else the package version */
export const runningVersion = () => versionOf(process.env.APP_VERSION || packageVersion)
