import { ANBIETER } from './anbieter'
import { useLocale } from '../../i18n'
import { DatenschutzPageEn } from './DatenschutzPageEn'
import { LegalPage, Section } from './LegalPage'

const li = 'list-disc space-y-1 pl-5'

/** German text, legally binding */
function DatenschutzPageDe() {
  return (
    <LegalPage id="privacy" title="Datenschutz">
      <p>
        Diese Erklärung beschreibt, welche personenbezogenen Daten Dominion of Steam verarbeitet,
        wozu und wie lange. Das Spiel kommt ohne Werbung, ohne Tracking und ohne Weitergabe von
        Daten an Dritte zu eigenen Zwecken aus.
      </p>

      <Section title="Verantwortlicher">
        <address className="not-italic">
          {ANBIETER.name}, {ANBIETER.strasse}, {ANBIETER.ort}, {ANBIETER.land}
          <br />
          E-Mail:{' '}
          <a
            href={`mailto:${ANBIETER.email}`}
            className="font-semibold text-teal-700 dark:text-teal-300"
          >
            {ANBIETER.email}
          </a>
        </address>
      </Section>

      <Section title="Hosting und Server-Protokolle">
        <p>
          Das Spiel läuft auf einem Server der netcup GmbH, Nürnberg (Deutschland). Beim Aufruf
          speichert der Server technische Protokolle: IP-Adresse, Zeitpunkt, aufgerufene Adresse,
          Statuscode und Browserkennung. Sie dienen dem sicheren Betrieb und der Fehlersuche (Art. 6
          Abs. 1 lit. f DSGVO) und werden nach kurzer Zeit überschrieben. Zum Schutz vor Missbrauch
          werden Anmeldeversuche je IP-Adresse kurzzeitig gezählt.
        </p>
      </Section>

      <Section title="Spielerkonto">
        <p>
          Für das Spielen ist ein Konto nötig. Dabei werden verarbeitet (Art. 6 Abs. 1 lit. b
          DSGVO):
        </p>
        <ul className={li}>
          <li>
            E-Mail-Adresse (Anmeldung, Bestätigung, Passwort zurücksetzen, Benachrichtigungen)
          </li>
          <li>
            Passwort, ausschließlich als salted Hash (scrypt); das Klartext-Passwort wird nicht
            gespeichert
          </li>
          <li>Anzeigename und, falls hochgeladen, ein Profilbild</li>
          <li>Einstellungen (Darstellung, Ton, Benachrichtigungen) und die gewählte Sprache</li>
          <li>
            Partiedaten: Spielstände, Züge, Ergebnisse und der Partieverlauf. Mitspielerinnen und
            Mitspieler sehen Anzeigename, Profilbild und Fraktion, nicht die E-Mail-Adresse.
            Angemeldete Spielerinnen und Spieler können Ihr Profil mit Bilanz, Partieverlauf und
            Abzeichen aufrufen.
          </li>
          <li>
            Freundesliste, Freundschaftsanfragen und Einladungen, soweit Sie diese Funktionen nutzen
          </li>
        </ul>
        <p>
          Ohne Bestätigung der E-Mail-Adresse werden keine Benachrichtigungen verschickt; das
          Spielen ist trotzdem möglich.
        </p>
        <p>
          Für den Betrieb sieht der Betreiber in einer internen Übersicht zusammengefasste
          Nutzungszahlen (Anzahl der Konten und Partien) sowie Anzeigenamen, Registrierungs- und
          Aktivitätszeitpunkte der Konten, ohne E-Mail-Adressen. Dafür werden keine weiteren Daten
          erhoben.
        </p>
      </Section>

      <Section title="Cookie">
        <p>
          Nach der Anmeldung setzt das Spiel ein einziges Cookie namens{' '}
          <code className="font-['IBM_Plex_Mono'] text-xs">dos_session</code>. Es hält die Sitzung,
          ist auf 30 Tage ab der letzten Nutzung begrenzt und für den Betrieb zwingend nötig (§ 25
          Abs. 2 Nr. 2 TDDDG). Es gibt keine Analyse-, Werbe- oder Drittanbieter-Cookies und deshalb
          auch kein Cookie-Banner. Darstellungsoptionen wie das Farbschema und die Sprache liegen
          zusätzlich im Speicher Ihres Browsers.
        </p>
      </Section>

      <Section title="E-Mail-Versand">
        <p>
          E-Mails (Bestätigung der Adresse, Passwort zurücksetzen, Hinweise bei Änderungen am Konto
          sowie die in den Einstellungen gewählten Benachrichtigungen) versendet das Spiel über den
          Dienstleister Mailjet SAS, Paris (Frankreich), als Auftragsverarbeiter nach Art. 28 DSGVO.
          Übermittelt werden Empfängeradresse und Inhalt der Mail. Öffnungs- und Klickverfolgung
          sind abgeschaltet.
        </p>
      </Section>

      <Section title="Push-Benachrichtigungen">
        <p>
          Auf Wunsch sendet das Spiel Benachrichtigungen an Ihren Browser (Web Push). Das geschieht
          nur, wenn Sie es in den Einstellungen einschalten und der Browser nachfragt. Dabei wird
          die Push-Adresse Ihres Browsers gespeichert; die Nachricht läuft über den Push-Dienst des
          Browser-Herstellers (zum Beispiel Mozilla, Google oder Apple). Sie können die Funktion
          jederzeit in den Einstellungen oder im Browser abschalten.
        </p>
      </Section>

      <Section title="Speicherdauer und Löschung">
        <ul className={li}>
          <li>
            Kontodaten bleiben gespeichert, solange das Konto besteht. Unter „Einstellungen → Konto
            löschen“ können Sie Ihr Konto selbst löschen. Dabei werden E-Mail-Adresse,
            Passwort-Hash, Profilbild, Einstellungen, Sitzungen, Freundschaften, Einladungen und
            Push-Abonnements gelöscht. Laufende Partien führt eine KI weiter; in beendeten Partien
            bleibt Ihr Anzeigename im Verlauf der Mitspieler erhalten.
          </li>
          <li>
            Einmal-Links (Bestätigung 24 Stunden, Passwort zurücksetzen 60 Minuten) verfallen
            automatisch.
          </li>
          <li>
            Sicherungskopien der Datenbank werden täglich erstellt und nach 7 Tagen (täglich), 4
            Wochen (wöchentlich) bzw. 6 Monaten (monatlich) gelöscht. Gelöschte Daten verschwinden
            spätestens nach dieser Frist auch aus den Sicherungen.
          </li>
        </ul>
      </Section>

      <Section title="Keine externen Dienste">
        <p>
          Schriften, Grafiken, Musik und Skripte werden vom eigenen Server ausgeliefert. Es gibt
          keine Analyse-Werkzeuge, keine Werbenetzwerke, keine Social-Media-Einbindungen und keine
          Schriften von Google.
        </p>
      </Section>

      <Section title="Ihre Rechte">
        <p>
          Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art.
          17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und
          Widerspruch (Art. 21). Wenden Sie sich dazu an die oben genannte E-Mail-Adresse. Außerdem
          können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, etwa bei der für Ihren
          Wohnort zuständigen Landesbehörde.
        </p>
      </Section>
    </LegalPage>
  )
}

/** Datenschutz: English as a convenience translation, German otherwise */
export function DatenschutzPage() {
  const { locale } = useLocale()
  return locale === 'en' ? <DatenschutzPageEn /> : <DatenschutzPageDe />
}
