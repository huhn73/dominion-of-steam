declare const __APP_VERSION__: string

export interface AppVersion {
  /** Shown version: „0.9.0“ for a release, „0.9.0+abc1234“ between releases, „0.9.0-dev“ locally */
  label: string
  /** Full commit hash, null outside the image build */
  commit: string | null
  /** Build date (ISO), null outside the image build */
  built: string | null
  /** Whether `label` is a release that has a tag `v<label>` */
  isRelease: boolean
}

/**
 * Version of the running game. The deploy workflow builds the image with `VITE_APP_VERSION`,
 * `VITE_APP_COMMIT` and `VITE_APP_BUILT` (Dockerfile); without them the version from the root
 * package.json is shown as a development build.
 */
export function appVersion(env: Partial<ImportMetaEnv> = import.meta.env): AppVersion {
  const given = (env.VITE_APP_VERSION as string | undefined)?.trim()
  const commit = (env.VITE_APP_COMMIT as string | undefined)?.trim() || null
  const built = (env.VITE_APP_BUILT as string | undefined)?.trim() || null
  const label = given || `${__APP_VERSION__}-dev`
  return { label, commit, built, isRelease: Boolean(given) && /^\d+\.\d+\.\d+$/.test(label) }
}
