#!/bin/bash

set -euo pipefail

# ==== CONFIG ===============================
DB_NAME="achieving_db"
DB_USER="vichet"
DB_PASS="34rds45r3f3wef"

MINIO_ALIAS="myminio"
MINIO_URL="http://217.216.108.106:9000"
MINIO_BUCKET="achieving"
MINIO_PATH="database-backup"

# Optional: read credentials from environment for mc alias
# If not set, alias will be configured without credentials (public buckets only)
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-}"

BACKUP_DIR="/opt/backups/mysql"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.sql.gz"

LOG_FILE="/var/log/mysql_minio_backup.log"
# ===========================================


log() {
    echo "$(date "+%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"

log "🔹 Starting MySQL backup script..."

# ==== 0. ENSURE DEPENDENCIES =================
ensure_mysqldump() {
    if command -v mysqldump >/dev/null 2>&1; then
        log "✅ mysqldump found."
        return
    fi
    log "🔎 mysqldump not found. Attempting to install (Debian)..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -y || true
        if sudo apt-get install -y default-mysql-client >/dev/null 2>&1; then
            log "✅ Installed default-mysql-client (mysqldump)."
        else
            if sudo apt-get install -y mariadb-client >/dev/null 2>&1; then
                log "✅ Installed mariadb-client (mysqldump)."
            else
                log "❌ Failed to install MySQL/MariaDB client via apt-get."
            fi
        fi
    else
        log "❌ apt-get not available; this script targets Debian systems."
    fi
    if ! command -v mysqldump >/dev/null 2>&1; then
        log "❌ mysqldump still not found after attempted install. Aborting."
        exit 1
    fi
}

ensure_mc() {
    if command -v mc >/dev/null 2>&1; then
        log "✅ MinIO client 'mc' found."
        return
    fi
    log "🔎 MinIO client 'mc' not found. Attempting to install (Debian)..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -y || true
        if sudo apt-get install -y minio-client >/dev/null 2>&1; then
            log "✅ Installed minio-client via apt-get."
        else
            ARCH="$(uname -m)"
            if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
                URL="https://dl.min.io/client/mc/release/linux-arm64/mc"
            else
                URL="https://dl.min.io/client/mc/release/linux-amd64/mc"
            fi
            log "⬇️  Downloading mc from $URL"
            sudo curl -fL "$URL" -o /usr/local/bin/mc && sudo chmod +x /usr/local/bin/mc || true
        fi
    else
        log "❌ apt-get not available; this script targets Debian systems."
    fi
    if ! command -v mc >/dev/null 2>&1; then
        log "❌ 'mc' still not found after attempted install. Aborting."
        exit 1
    fi
}

ensure_mc_alias() {
    # Ensure mc is installed first
    ensure_mc
    if mc alias ls | grep -q "^$MINIO_ALIAS"; then
        if [ -n "$MINIO_ACCESS_KEY" ] && [ -n "$MINIO_SECRET_KEY" ]; then
            log "🔧 Updating MinIO alias '$MINIO_ALIAS' with credentials..."
            mc alias set "$MINIO_ALIAS" "$MINIO_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api S3v4
        else
            log "✅ MinIO alias '$MINIO_ALIAS' already configured."
            return
        fi
    else
        log "🔧 Setting MinIO alias '$MINIO_ALIAS'..."
        if [ -n "$MINIO_ACCESS_KEY" ] && [ -n "$MINIO_SECRET_KEY" ]; then
            mc alias set "$MINIO_ALIAS" "$MINIO_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api S3v4
        else
            log "ℹ️ MINIO_ACCESS_KEY/SECRET not provided; attempting alias without credentials (public buckets only)."
            mc alias set "$MINIO_ALIAS" "$MINIO_URL" "" "" --api S3v4 || {
                log "❌ Failed to set mc alias without credentials; credentials may be required."
                exit 1
            }
        fi
    fi
}

# Run dependency checks
ensure_mysqldump
ensure_mc_alias

detect_mysqldump_ssl_opt() {
    local opt=""
    if mysqldump --help 2>&1 | grep -q -- "--ssl-mode"; then
        opt="--ssl-mode=DISABLED"
    elif mysqldump --help 2>&1 | grep -q -- "--skip-ssl"; then
        opt="--skip-ssl"
    else
        opt="" # No SSL option supported; omit
    fi
    echo "$opt"
}

detect_mysqldump_no_tablespaces_opt() {
    local opt=""
    if mysqldump --help 2>&1 | grep -q -- "--no-tablespaces"; then
        opt="--no-tablespaces"
    else
        opt="" # Older clients may not support; omit
    fi
    echo "$opt"
}

# ==== 1. RUN DUMP ===========================
log "📦 Running mysqldump..."
MYSQL_SSL_OPT="$(detect_mysqldump_ssl_opt)"
MYSQL_NO_TSP_OPT="$(detect_mysqldump_no_tablespaces_opt)"

# Run dump with controlled error handling to capture pipeline status
set +e
DUMP_ERR_FILE="${BACKUP_DIR}/${BACKUP_FILE%.sql.gz}.stderr.log"
MYSQL_PWD="${DB_PASS}" mysqldump ${MYSQL_SSL_OPT} ${MYSQL_NO_TSP_OPT} --single-transaction -u"${DB_USER}" "${DB_NAME}" 2>"${DUMP_ERR_FILE}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"
DUMP_EXIT=${PIPESTATUS[0]}
set -e

if [ ${DUMP_EXIT} -ne 0 ] || grep -q "^mysqldump: Error:" "${DUMP_ERR_FILE}" 2>/dev/null; then
    log "❌ Error: mysqldump failed (exit ${DUMP_EXIT})."
    if [ -s "${DUMP_ERR_FILE}" ]; then
        log "   Details: $(tail -n 3 "${DUMP_ERR_FILE}")"
    fi
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || true
    exit 1
fi

log "✅ Dump created: ${BACKUP_FILE}"

# ==== 2. CONFIGURE MC IF NOT EXISTS ==========
if ! mc alias ls | grep -q "$MINIO_ALIAS"; then
    log "🔧 Setting MinIO alias..."
    mc alias set "$MINIO_ALIAS" "$MINIO_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
fi

# ==== 2b. PRE-CHECK MINIO WRITE PERMISSION ===
ensure_minio_write_access() {
    local test_file
    test_file="$(mktemp)" || true
    echo "minio-write-check $(date)" > "$test_file"
    local dest="${MINIO_ALIAS}/${MINIO_BUCKET}/${MINIO_PATH}/.write-check-$(date +%s).txt"
    if ! mc cp "$test_file" "$dest" >/dev/null 2>&1; then
        log "❌ MinIO write test failed for '${MINIO_BUCKET}/${MINIO_PATH}'."
        log "➡️  Enable anonymous write on the path if you need public uploads:"
        log "   mc anonymous set upload ${MINIO_ALIAS}/${MINIO_BUCKET}/${MINIO_PATH}"
        log "   (or configure a restricted user and set MINIO_ACCESS_KEY/SECRET)"
        rm -f "$test_file" 2>/dev/null || true
        exit 1
    fi
    mc rm "$dest" >/dev/null 2>&1 || true
    rm -f "$test_file" 2>/dev/null || true
    log "✅ MinIO write permission verified for '${MINIO_BUCKET}/${MINIO_PATH}'."
}

ensure_minio_write_access

# ==== 3. UPLOAD TO MINIO ====================
log "📤 Uploading to MinIO..."
mc cp "${BACKUP_DIR}/${BACKUP_FILE}" "${MINIO_ALIAS}/${MINIO_BUCKET}/${MINIO_PATH}/"

if [ $? -ne 0 ]; then
    log "❌ Upload failed! Likely insufficient permissions for '${MINIO_BUCKET}/${MINIO_PATH}'."
    log "➡️  Fix options:"
    log "   - Provide MINIO_ACCESS_KEY and MINIO_SECRET_KEY in environment."
    log "   - Or update bucket policy to allow write to '${MINIO_BUCKET}/${MINIO_PATH}/*'."
    log "     Example (mc): mc anonymous set upload ${MINIO_ALIAS}/${MINIO_BUCKET}/${MINIO_PATH} || mc admin policy add"
    exit 1
fi

log "✅ Successfully uploaded to MinIO: ${MINIO_BUCKET}/${MINIO_PATH}/${BACKUP_FILE}"

# ==== 4. CLEAN OLD BACKUPS ==================
log "🧹 Removing backups older than 7 days..."
find "$BACKUP_DIR" -type f -mtime +7 -name "*.sql.gz" -delete

log "🎉 Backup completed successfully!"