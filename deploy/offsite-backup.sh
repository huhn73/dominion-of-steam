#!/usr/bin/env bash
# Nächtliche Sicherung außer Haus: neuester Datenbank-Dump, Uploads und .env gehen verschlüsselt
# per restic (über rclone) an ein rclone-Ziel, z. B. Google Drive. Ziel und Schlüssel stehen in
# backup.env (Vorlage backup.env.example). Aufbewahrung wie beim Dump-Container: 7 Tage /
# 4 Wochen / 6 Monate (Datenschutzerklärung!), sonntags zusätzlich eine Stichprobenprüfung.
#
# Schlägt ein Schritt fehl, wird die Meldung an ALERT_CMD übergeben (Betreff als Argument, Text
# über stdin), z. B. ein Mail-Skript. Ohne ALERT_CMD landet sie nur im Log.
#
# Cron: 30 4 * * * /opt/dominion/offsite-backup.sh >> /opt/dominion/offsite.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"

log=$(mktemp)
trap 'rm -f "$log"' EXIT

run() { docker compose run --rm -T offsite "$@"; }

# restic startet rclone und wartet standardmäßig nur 1 Minute auf dessen erste Antwort. Bremst
# der Anbieter die Anfragen, dauert das länger („error talking HTTP to rclone … context deadline
# exceeded“). Daher mehr Geduld und bis zu drei Versuche mit Pause dazwischen.
restic() {
  local try
  for try in 1 2 3; do
    run restic -o rclone.timeout=5m "$@" && return 0
    [[ $try == 3 ]] && return 1
    echo "-- Versuch $try fehlgeschlagen, neuer Versuch in 2 Minuten"
    sleep 120
  done
}

fail() {
  echo "!! Sicherung fehlgeschlagen: $1" >&2
  if [[ -n ${ALERT_CMD:-} ]]; then
    {
      echo "Die nächtliche Sicherung von Dominion of Steam auf $(hostname) ist fehlgeschlagen."
      echo "Schritt: $1"
      echo
      echo "Letzte Ausgabe:"
      tail -n 40 "$log"
    } | bash -c "$ALERT_CMD \"\$1\"" _ "Dominion: Backup fehlgeschlagen" ||
      echo "!! Auch die Hinweis-Mail ließ sich nicht verschicken." >&2
  fi
  exit 1
}

step() {
  local name=$1
  shift
  echo "== $(date '+%F %T') $name"
  "$@" 2>&1 | tee -a "$log" || fail "$name"
}

# Der backup-Container dumpt täglich; ein Dump älter als 26 Stunden heißt, dass er hängt.
step "Aktuellen Dump prüfen" run sh -c \
  'find /data/db/last -name "*.sql.gz" -mmin -1560 | grep -q . || { echo "Kein Dump jünger als 26 Stunden in db_backups/last"; exit 1; }'

step "Sichern" restic backup --host dominion --tag nightly \
  /data/db/last /data/uploads /data/config

step "Alte Stände aufräumen" restic forget --prune --host dominion \
  --keep-daily 7 --keep-weekly 4 --keep-monthly 6

if [[ $(date +%u) == 7 ]]; then
  step "Stichprobe prüfen" restic check --read-data-subset=5%
fi

echo "== $(date '+%F %T') fertig"
