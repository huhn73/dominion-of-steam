import { ANBIETER } from './anbieter'
import { LegalPage, Section } from './LegalPage'

/** English translation of the imprint; the German version is binding */
export function ImpressumPageEn() {
  return (
    <LegalPage id="imprint" title="Imprint" translation>
      <Section title="Information according to § 5 DDG">
        <address className="not-italic">
          {ANBIETER.name}
          <br />
          {ANBIETER.strasse}
          <br />
          {ANBIETER.ort}
          <br />
          {ANBIETER.land}
        </address>
      </Section>

      <Section title="Contact">
        <p>
          E-mail:{' '}
          <a
            href={`mailto:${ANBIETER.email}`}
            className="font-semibold text-teal-700 underline-offset-4 hover:underline dark:text-teal-300"
          >
            {ANBIETER.email}
          </a>
        </p>
      </Section>

      <Section title="Responsible for the content">
        <p>
          {ANBIETER.name}, address as above. Dominion of Steam is a private, non-commercial hobby
          project without advertising and without payment features.
        </p>
      </Section>

      <Section title="Liability for content and links">
        <p>
          The content of these pages was created with care. No guarantee is given for its accuracy,
          completeness or timeliness. Players are responsible for the content they add themselves
          (display names, profile pictures, match names); such content is removed upon notice of a
          legal violation. Only their operators are responsible for linked external pages.
        </p>
      </Section>

      <Section title="Copyright">
        <p>
          Source code, graphics, music and sound effects are subject to the terms named on the
          “Licences” page.
        </p>
      </Section>
    </LegalPage>
  )
}
