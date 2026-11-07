import { ANBIETER } from './anbieter'
import { LegalPage, Section } from './LegalPage'

const li = 'list-disc space-y-1 pl-5'

/** English translation of the privacy notice; the German version is binding */
export function DatenschutzPageEn() {
  return (
    <LegalPage id="privacy" title="Privacy" translation>
      <p>
        This notice describes which personal data Dominion of Steam processes, for what purpose and
        for how long. The game does without advertising, without tracking and without passing data
        on to third parties for their own purposes.
      </p>

      <Section title="Controller">
        <address className="not-italic">
          {ANBIETER.name}, {ANBIETER.strasse}, {ANBIETER.ort}, {ANBIETER.land}
          <br />
          E-mail:{' '}
          <a
            href={`mailto:${ANBIETER.email}`}
            className="font-semibold text-teal-700 dark:text-teal-300"
          >
            {ANBIETER.email}
          </a>
        </address>
      </Section>

      <Section title="Hosting and server logs">
        <p>
          The game runs on a server of netcup GmbH, Nuremberg (Germany). When the game is accessed,
          the server stores technical logs: IP address, time, requested address, status code and
          browser identifier. They serve secure operation and troubleshooting (Art. 6(1)(f) GDPR)
          and are overwritten after a short time. To protect against abuse, login attempts are
          briefly counted per IP address.
        </p>
      </Section>

      <Section title="Player account">
        <p>An account is needed to play. The following is processed (Art. 6(1)(b) GDPR):</p>
        <ul className={li}>
          <li>E-mail address (login, confirmation, password reset, notifications)</li>
          <li>
            Password, exclusively as a salted hash (scrypt); the plain-text password is not stored
          </li>
          <li>Display name and, if uploaded, a profile picture</li>
          <li>Settings (display, sound, notifications) and the chosen language</li>
          <li>
            Match data: game states, moves, results and the match history. Other players see your
            display name, profile picture and faction, not your e-mail address.
          </li>
          <li>Friends list and invitations, insofar as you use these features</li>
        </ul>
        <p>
          Without confirmation of the e-mail address, no notifications are sent; playing is still
          possible.
        </p>
        <p>
          For operation, the operator sees aggregated usage figures (number of accounts and matches)
          as well as display names and the registration and activity times of accounts, without
          e-mail addresses, in an internal overview. No further data is collected for this.
        </p>
      </Section>

      <Section title="Cookie">
        <p>
          After login, the game sets a single cookie named{' '}
          <code className="font-['IBM_Plex_Mono'] text-xs">dos_session</code>. It keeps the session,
          is limited to 30 days from the last use and is strictly necessary for operation (§ 25(2)
          no. 2 TDDDG). There are no analytics, advertising or third-party cookies and therefore no
          cookie banner either. Display options such as the colour scheme and the language are
          additionally kept in your browser’s storage.
        </p>
      </Section>

      <Section title="Sending e-mails">
        <p>
          The game sends e-mails (address confirmation, password reset, notices of changes to the
          account and the notifications chosen in the settings) via the service provider Mailjet
          SAS, Paris (France), as a processor under Art. 28 GDPR. The recipient address and the
          content of the mail are transmitted. Open and click tracking are switched off.
        </p>
      </Section>

      <Section title="Push notifications">
        <p>
          On request, the game sends notifications to your browser (web push). This only happens if
          you switch it on in the settings and the browser asks. The push address of your browser is
          stored for this; the message runs through the push service of the browser vendor (for
          example Mozilla, Google or Apple). You can switch the feature off at any time in the
          settings or in the browser.
        </p>
      </Section>

      <Section title="Storage period and deletion">
        <ul className={li}>
          <li>
            Account data is stored for as long as the account exists. You can delete your account
            yourself under “Settings → Delete account”. This deletes the e-mail address, password
            hash, profile picture, settings, sessions, friendships, invitations and push
            subscriptions. An AI continues running matches; in finished matches your display name
            remains in the other players’ history.
          </li>
          <li>
            One-time links (confirmation 24 hours, password reset 60 minutes) expire automatically.
          </li>
          <li>
            Backups of the database are made daily and deleted after 7 days (daily), 4 weeks
            (weekly) or 6 months (monthly). Deleted data disappears from the backups at the latest
            after this period.
          </li>
        </ul>
      </Section>

      <Section title="No external services">
        <p>
          Fonts, graphics, music and scripts are delivered from the game’s own server. There are no
          analytics tools, no advertising networks, no social media embeds and no fonts from Google.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17),
          restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21).
          To exercise them, contact the e-mail address given above. You can also lodge a complaint
          with a data protection supervisory authority, for example the state authority responsible
          for your place of residence.
        </p>
      </Section>
    </LegalPage>
  )
}
