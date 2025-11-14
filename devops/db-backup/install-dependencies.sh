#!/usr/bin/env bash
set -euo pipefail

# Prepare environment for devops/db-backup/db-backup-to-minio.py on Debian/Ubuntu
# - Installs: python3, MySQL/MariaDB client, awscli, curl, gzip
# - Creates backup directory and default env config at /etc/achieving/db-backup.env
# - Writes a local .env.example in the db-backup folder

BACKUP_PARENT_DIR=${BACKUP_PARENT_DIR:-/mnt/backups/mysql}
ETC_DIR=/etc/achieving
ETC_ENV="${ETC_DIR}/db-backup.env"

echo "Preparing environment for db-backup-to-minio.py..."

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y
  # Try default-mysql-client first; fallback to mariadb-client if not available
  if ! sudo apt-get install -y python3 python3-venv default-mysql-client awscli curl gzip; then
    sudo apt-get install -y python3 python3-venv mariadb-client awscli curl gzip || true
  fi
else
  echo "apt-get not found; please install required packages manually: python3, mysql-client or mariadb-client, awscli, curl, gzip"
fi

# Ensure backup directory
sudo mkdir -p "${BACKUP_PARENT_DIR}"
sudo chmod 700 "${BACKUP_PARENT_DIR}"

# Ensure /etc/achieving and default env file
sudo mkdir -p "${ETC_DIR}"
if [ ! -f "${ETC_ENV}" ]; then
  sudo tee "${ETC_ENV}" >/dev/null <<'EOF'
BACKUP_PARENT_DIR=/mnt/backups/mysql
MYSQL_HOST=62.146.233.58
MYSQL_PORT=3306
MYSQL_USER=vichet
MYSQL_PASSWORD=CHANGE_ME
MINIO_ENDPOINT_URL=http://217.216.108.106:9000
MINIO_BUCKET=achieving
MINIO_PATH=database-backup
DATABASES=achieving_db
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
EOF
  sudo chmod 600 "${ETC_ENV}"
fi

# Write local .env.example alongside the script for convenience
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ENV_EXAMPLE="${SCRIPT_DIR}/.env.example"
if [ ! -f "${REPO_ENV_EXAMPLE}" ]; then
  tee "${REPO_ENV_EXAMPLE}" >/dev/null <<'EOF'
BACKUP_PARENT_DIR=/mnt/backups/mysql
MYSQL_HOST=62.146.233.58
MYSQL_PORT=3306
MYSQL_USER=vichet
MYSQL_PASSWORD=CHANGE_ME
MINIO_ENDPOINT_URL=http://217.216.108.106:9000
MINIO_BUCKET=achieving
MINIO_PATH=database-backup
DATABASES=achieving_db
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
EOF
fi

echo "Environment prepared. Edit ${ETC_ENV} with correct secrets, then run:"
echo "  python3 db-backup-to-minio.py"