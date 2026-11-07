import { ANBIETER } from './anbieter'
import { FONTS, mitText, SFX_RECORDINGS } from './licenseData'
import { ExternalLink, LegalPage, Section } from './LegalPage'

/** English translation of the licence page; the German version is binding */
export function LizenzenPageEn() {
  return (
    <LegalPage id="licenses" title="Licences" translation>
      <Section title="Game and source code">
        <p>
          The source code of Dominion of Steam is licensed under the MIT licence and can be viewed
          in the <ExternalLink href={ANBIETER.repo}>repository</ExternalLink>.
        </p>
        <details className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-950">
          <summary className="cursor-pointer text-sm font-semibold">Show licence text</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-['IBM_Plex_Mono'] text-xs leading-relaxed">
            {mitText}
          </pre>
        </details>
      </Section>

      <Section title="Illustrations, coats of arms, music and ambience">
        <p>
          Illustrations, coats of arms, portraits, music and ambient sounds are excluded from the
          MIT licence; all rights reserved. Created by the project owner with Suno; the original WAV
          files are kept privately.
        </p>
      </Section>

      <Section title="Sound effects">
        <p>
          Edited and mixed from CC0 recordings; the submarine ping was generated procedurally for
          the project. The effects are based on these recordings, which their authors released
          under{' '}
          <ExternalLink href="https://creativecommons.org/publicdomain/zero/1.0/">
            CC0 1.0
          </ExternalLink>{' '}
          (
          <a href="/audio/CC0-1.0.txt" className="font-semibold text-teal-700 dark:text-teal-300">
            licence text
          </a>
          ):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {SFX_RECORDINGS.map((r) => (
            <li key={r.source}>
              <ExternalLink href={r.source}>{r.title}</ExternalLink> by {r.author} ({r.license})
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Fonts and icons">
        <p>
          The fonts {FONTS.join(', ')} are licensed under the{' '}
          <ExternalLink href="https://openfontlicense.org/">SIL Open Font License 1.1</ExternalLink>{' '}
          and are delivered from the game’s own server. The icons come from{' '}
          <ExternalLink href="https://lucide.dev/">Lucide</ExternalLink> (ISC licence).
        </p>
      </Section>

      <Section title="Libraries">
        <p>
          The game uses open-source libraries such as React, Fastify and Tailwind CSS. The complete
          list with versions and licences is in the{' '}
          <code className="font-['IBM_Plex_Mono'] text-xs">package.json</code> files of the{' '}
          <ExternalLink href={ANBIETER.repo}>repository</ExternalLink>.
        </p>
      </Section>
    </LegalPage>
  )
}
