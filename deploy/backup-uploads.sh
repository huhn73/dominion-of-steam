#!/usr/bin/env bash
# Archiviert das Upload-Volume (Avatare) nach /opt/dominion/backups/uploads-<datum>.tar.gz
# und behält die letzten 14 Archive. Täglich per Cron, siehe README.md.
set -euo pipefail
cd "$(dirname "$0")"
dest=/opt/dominion/backups
mkdir -p "$dest"
volume=$(docker compose config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["volumes"]["uploads"]["name"])')
docker run --rm -v "$volume":/data:ro -v "$dest":/backup alpine \
  tar czf "/backup/uploads-$(date +%F).tar.gz" -C /data .
ls -1t "$dest"/uploads-*.tar.gz | tail -n +15 | xargs -r rm --
