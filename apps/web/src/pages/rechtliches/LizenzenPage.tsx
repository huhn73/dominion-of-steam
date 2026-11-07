import { ANBIETER } from './anbieter'
import { useLocale } from '../../i18n'
import { credits, FONTS, mitText, SFX_RECORDINGS } from './licenseData'
import { LizenzenPageEn } from './LizenzenPageEn'
import { ExternalLink, LegalPage, Section } from './LegalPage'

export { SFX_RECORDINGS }

/** German text, legally binding */
function LizenzenPageDe() {
  return (
    <LegalPage id="licenses" title="Lizenzen">
      <Section title="Spiel und Quellcode">
        <p>
          Der Quellcode von Dominion of Steam steht unter der MIT-Lizenz und ist im{' '}
          <ExternalLink href={ANBIETER.repo}>Repository</ExternalLink> einsehbar.
        </p>
        <details className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-950">
          <summary className="cursor-pointer text-sm font-semibold">Lizenztext anzeigen</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-['IBM_Plex_Mono'] text-xs leading-relaxed">
            {mitText}
          </pre>
        </details>
      </Section>

      <Section title="Illustrationen, Wappen, Musik und Ambiente">
        <p>
          Illustrationen, Wappen, Porträts, Musik und Umgebungsgeräusche sind von der MIT-Lizenz
          ausgenommen; alle Rechte vorbehalten. {credits.music_and_ambience}
        </p>
      </Section>

      <Section title="Soundeffekte">
        <p>
          {credits.sfx_note} Die Effekte beruhen auf diesen Aufnahmen, die ihre Urheber unter{' '}
          <ExternalLink href="https://creativecommons.org/publicdomain/zero/1.0/deed.de">
            CC0 1.0
          </ExternalLink>{' '}
          freigegeben haben (
          <a href="/audio/CC0-1.0.txt" className="font-semibold text-teal-700 dark:text-teal-300">
            Lizenztext
          </a>
          ):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {SFX_RECORDINGS.map((r) => (
            <li key={r.source}>
              <ExternalLink href={r.source}>{r.title}</ExternalLink> von {r.author} ({r.license})
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Schriften und Symbole">
        <p>
          Die Schriften {FONTS.join(', ')} stehen unter der{' '}
          <ExternalLink href="https://openfontlicense.org/">SIL Open Font License 1.1</ExternalLink>{' '}
          und werden vom eigenen Server ausgeliefert. Die Symbole stammen aus{' '}
          <ExternalLink href="https://lucide.dev/">Lucide</ExternalLink> (ISC-Lizenz).
        </p>
      </Section>

      <Section title="Bibliotheken">
        <p>
          Das Spiel nutzt Open-Source-Bibliotheken wie React, Fastify und Tailwind CSS. Die
          vollständige Liste mit Versionen und Lizenzen steht in den{' '}
          <code className="font-['IBM_Plex_Mono'] text-xs">package.json</code>-Dateien des{' '}
          <ExternalLink href={ANBIETER.repo}>Repositories</ExternalLink>.
        </p>
      </Section>
    </LegalPage>
  )
}

/** Lizenzen: English as a convenience translation, German otherwise */
export function LizenzenPage() {
  const { locale } = useLocale()
  return locale === 'en' ? <LizenzenPageEn /> : <LizenzenPageDe />
}
