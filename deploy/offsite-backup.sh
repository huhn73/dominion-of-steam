#!/usr/bin/env bash
# Kopiert die Datenbank-Dumps (Volume db_backups) und die Upload-Archive an ein Ziel außerhalb
# des Servers. OFFSITE ist ein rsync-Ziel (user@host:/pfad) oder ein rclone-Remote (remote:pfad),
# z. B. netcup Storage Space, eine Storage Box oder dein Heimnetz. Täglich per Cron nach
# backup-uploads.sh, siehe README.md.
set -euo pipefail
cd "$(dirname "$0")"
: "${OFFSITE:?OFFSITE fehlt, z. B. backup@home.example:/srv/dominion oder storagebox:dominion}"
stage=/opt/dominion/backups
volume=$(docker compose config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["volumes"]["db_backups"]["name"])')
# Dumps aus dem Volume in den Staging-Ordner spiegeln (nur die täglichen, die Wochen- und
# Monatsordner sind Hardlinks derselben Dateien)
docker run --rm -v "$volume":/data:ro -v "$stage":/backup alpine \
  sh -c 'mkdir -p /backup/db && cp -u /data/daily/* /backup/db/'
if command -v rclone >/dev/null && [[ "$OFFSITE" != *@* ]]; then
  rclone sync "$stage" "$OFFSITE"
else
  rsync -az --delete "$stage/" "$OFFSITE/"
fi
