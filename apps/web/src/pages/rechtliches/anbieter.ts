/**
 * Provider details for the imprint and the privacy notice. They are not stored in the repository:
 * the image build passes them as VITE_ANBIETER_* (GitHub repository variables, see deploy/README.md),
 * locally they can go into apps/web/.env.local. Without them the placeholders below are shown,
 * flagged on the imprint page in development.
 */
const env = (value: string | undefined, fallback: string): string => value?.trim() || fallback

export const PLATZHALTER_NAME = 'Max Mustermann'

export const ANBIETER = {
  name: env(import.meta.env.VITE_ANBIETER_NAME, PLATZHALTER_NAME),
  strasse: env(import.meta.env.VITE_ANBIETER_STRASSE, 'Musterstraße 1'),
  ort: env(import.meta.env.VITE_ANBIETER_ORT, '12345 Musterstadt'),
  land: env(import.meta.env.VITE_ANBIETER_LAND, 'Deutschland'),
  email: env(import.meta.env.VITE_ANBIETER_EMAIL, 'kontakt@example.org'),
  /** Public repository with source code, LICENSE and package.json */
  repo: 'https://github.com/huhn73/dominion-of-steam',
} as const

/** Date shown under the legal texts (ISO); bump it when the texts change */
export const STAND = '2026-11-07'

export const istPlatzhalter = () => ANBIETER.name === PLATZHALTER_NAME
