import { ANBIETER, istPlatzhalter } from './anbieter'
import { LegalPage, Section } from './LegalPage'

export function ImpressumPage() {
  return (
    <LegalPage id="imprint" title="Impressum">
      {import.meta.env.DEV && istPlatzhalter() && (
        <p
          role="status"
          className="rounded-md border border-amber-300 border-l-4 border-l-amber-600 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        >
          Platzhalter: Die Anbieterdaten kommen aus{' '}
          <code className="font-['IBM_Plex_Mono'] text-xs">VITE_ANBIETER_*</code> (lokal in{' '}
          <code className="font-['IBM_Plex_Mono'] text-xs">apps/web/.env.local</code>, beim Deploy
          aus den Repository-Variablen).
        </p>
      )}

      <Section title="Angaben gemäß § 5 DDG">
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

      <Section title="Kontakt">
        <p>
          E-Mail:{' '}
          <a
            href={`mailto:${ANBIETER.email}`}
            className="font-semibold text-teal-700 underline-offset-4 hover:underline dark:text-teal-300"
          >
            {ANBIETER.email}
          </a>
        </p>
      </Section>

      <Section title="Verantwortlich für den Inhalt">
        <p>
          {ANBIETER.name}, Anschrift wie oben. Dominion of Steam ist ein privates, nicht
          gewerbliches Hobbyprojekt ohne Werbung und ohne Bezahlfunktionen.
        </p>
      </Section>

      <Section title="Haftung für Inhalte und Links">
        <p>
          Die Inhalte dieser Seiten wurden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit
          und Aktualität wird keine Gewähr übernommen. Spielinhalte, die Spielerinnen und Spieler
          selbst einstellen (Anzeigenamen, Profilbilder, Partienamen), verantworten diese selbst;
          bei Hinweisen auf Rechtsverstöße werden solche Inhalte entfernt. Für verlinkte externe
          Seiten sind ausschließlich deren Betreiber verantwortlich.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Quellcode, Grafiken, Musik und Soundeffekte stehen unter den auf der Seite „Lizenzen“
          genannten Bedingungen.
        </p>
      </Section>
    </LegalPage>
  )
}
