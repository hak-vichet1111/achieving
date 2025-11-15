#!/bin/bash
set -e

############################
## CONFIG
############################

# MySQL
DB_NAME="achieving_db"
DB_USER="root"
DB_PASS="21wqsaXZ"

# Backup directory
BACKUP_DIR="/opt/backups/mysql"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.sql.gz"

# MinIO
MINIO_ALIAS="myminio"
MINIO_URL="http://217.216.108.106:9000"
MINIO_BUCKET="achieving"
MINIO_PATH="database-backup"

# MinIO credentials (export these into environment later)
MINIO_ACCESS_KEY="vichet"
MINIO_SECRET_KEY="21wqsaXZ3edc"

# Telegram
TELEGRAM_BOT_TOKEN="8033277462:AAGhQ_ROqmKObcFjKatjEvvr8x1eGkYueyg"
TELEGRAM_CHAT_ID="-4906597719"

# Log file
#LOG_FILE="/var/log/mysql_minio_backup.log"


############################
## FUNCTION: Log
############################
log() {
    # echo "$(date "+%Y-%m-%d %H:%M:%S")  $1" | tee -a "$LOG_FILE"
    echo "$(date "+%Y-%m-%d %H:%M:%S") $1"
}


############################
## RUN BACKUP
############################
log "🔹 Starting database backup..."

mkdir -p "$BACKUP_DIR"

log "📦 Dumping MySQL database..."
mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -ne 0 ]; then
    log "❌ mysqldump failed!"
    exit 1
fi

log "✅ Backup created: $BACKUP_FILE"


############################
## CONFIGURE MINIO
############################
if ! mc alias ls | grep -q "$MINIO_ALIAS"; then
    log "🔧 Setting MinIO alias..."
    mc alias set "$MINIO_ALIAS" "$MINIO_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
fi


############################
## UPLOAD TO MINIO
############################
log "📤 Uploading backup to MinIO..."

mc cp "$BACKUP_DIR/$BACKUP_FILE" "${MINIO_ALIAS}/${MINIO_BUCKET}/${MINIO_PATH}/"

if [ $? -ne 0 ]; then
    log "❌ Upload to MinIO failed!"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT_ID" \
        -d text="❌ MySQL backup FAILED to upload to MinIO!"
    exit 1
fi

log "✅ Successfully uploaded to MinIO!"


############################
## TELEGRAM NOTIFICATION
############################
log "📨 Sending Telegram notification..."

MESSAGE="✅ MySQL Backup Success
Database: ${DB_NAME}
File: ${BACKUP_FILE}
Uploaded to MinIO Bucket: ${MINIO_BUCKET}/${MINIO_PATH}
Time: $(date +"%Y-%m-%d %H:%M:%S")"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="$MESSAGE"

log "📩 Telegram notification sent."


############################
## CLEANUP OLD FILES
############################
log "🧹 Removing local backups older than 7 days..."
find "$BACKUP_DIR" -type f -mtime +7 -name "*.gz" -delete

log "🎉 Backup process complete!"