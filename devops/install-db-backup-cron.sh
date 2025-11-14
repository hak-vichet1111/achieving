#!/usr/bin/env bash
set -euo pipefail

log() { echo "[install-backup-cron] $*"; }

CONF_PATH=${CONF_PATH:-/etc/achieving/db-backup.conf}
BACKUP_SCRIPT=${BACKUP_SCRIPT:-/usr/local/bin/db-backup-to-minio.sh}
CRON_FILE=${CRON_FILE:-/etc/cron.d/achieving-db-backup}
SCHEDULE=${SCHEDULE:-"15 1 * * *"} # default: 01:15 UTC daily

if [ ! -f "$BACKUP_SCRIPT" ]; then
  if [ -f "$(dirname "$0")/db-backup-to-minio.sh" ]; then
    sudo cp "$(dirname "$0")/db-backup-to-minio.sh" "$BACKUP_SCRIPT"
    sudo chmod +x "$BACKUP_SCRIPT"
  else
    echo "Backup script not found: $BACKUP_SCRIPT" >&2
    exit 1
  fi
fi

sudo mkdir -p "$(dirname "$CONF_PATH")"
if [ ! -f "$CONF_PATH" ]; then
  log "Config $CONF_PATH not found; creating a template. Please edit values."
  sudo tee "$CONF_PATH" >/dev/null <<'EOF'
# MySQL connection
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=vichet
DB_PASS=change_me
DB_NAME=achieving_db

# MinIO connection
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ACCESS_KEY=vichet
MINIO_SECRET_KEY=change_me
MINIO_BUCKET=achieving-backups

# Optional: customize remote prefix and retention
# REMOTE_PREFIX=db-backups/${DB_NAME}/${HOSTNAME}
# RETENTION_DAYS=7

# Telegram alerts (optional)
# TELEGRAM_BOT_TOKEN=123456:ABCDEF
# TELEGRAM_CHAT_ID=-1001234567890
EOF
fi

log "Writing cron at $CRON_FILE"
sudo tee "$CRON_FILE" >/dev/null <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
$SCHEDULE root CONF_PATH=$CONF_PATH $BACKUP_SCRIPT >> /var/log/achieving-db-backup.log 2>&1
EOF

sudo chmod 0644 "$CRON_FILE"

log "Reloading cron"
sudo systemctl reload cron || sudo systemctl restart cron || true

log "Installed cron job. Verify with: cat $CRON_FILE"