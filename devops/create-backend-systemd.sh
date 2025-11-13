#!/bin/bash
set -euo pipefail

log() { echo -e "\e[32m[INFO] $*\e[0m"; }
warn() { echo -e "\e[33m[WARN] $*\e[0m"; }
error() { echo -e "\e[31m[ERROR] $*\e[0m"; exit 1; }

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  error "Please run this script with sudo/root privileges."
fi

# Defaults
SERVICE_NAME="achieving-backend"
SERVICE_USER="www-data"
SERVICE_GROUP="www-data"
WORKDIR="/data/achieving/backend"
EXEC_PATH="/data/achieving/backend/achieving-backend"
ENV_FILE="/data/achieving/backend/.env"

# Discover repo binary as a convenience
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_BIN_CANDIDATE="${SCRIPT_DIR}/../backend/achieving-backend"

echo ""
echo "Systemd Service Setup for Go Backend"
read -p "Service name [${SERVICE_NAME}]: " _SERVICE_NAME || true
SERVICE_NAME=${_SERVICE_NAME:-$SERVICE_NAME}

read -p "Service user [${SERVICE_USER}]: " _SERVICE_USER || true
SERVICE_USER=${_SERVICE_USER:-$SERVICE_USER}
read -p "Service group [${SERVICE_GROUP}]: " _SERVICE_GROUP || true
SERVICE_GROUP=${_SERVICE_GROUP:-$SERVICE_GROUP}

read -p "Working directory [${WORKDIR}]: " _WORKDIR || true
WORKDIR=${_WORKDIR:-$WORKDIR}

read -p "Executable path [${EXEC_PATH}]: " _EXEC_PATH || true
EXEC_PATH=${_EXEC_PATH:-$EXEC_PATH}

read -p "Environment file [${ENV_FILE}]: " _ENV_FILE || true
ENV_FILE=${_ENV_FILE:-$ENV_FILE}

mkdir -p "$WORKDIR"

if [ ! -x "$EXEC_PATH" ]; then
  if [ -x "$REPO_BIN_CANDIDATE" ]; then
    log "Executable not found at ${EXEC_PATH}, copying repo binary from ${REPO_BIN_CANDIDATE}"
    install -m 0755 "$REPO_BIN_CANDIDATE" "$EXEC_PATH"
  else
    warn "Executable not found at ${EXEC_PATH} and no repo binary discovered."
    warn "Please place your compiled backend binary at ${EXEC_PATH} before starting the service."
  fi
fi

if [ ! -f "$ENV_FILE" ]; then
  log "Creating environment file at ${ENV_FILE}"
  cat > "$ENV_FILE" <<'EOF'
# Achieving backend environment
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=achieving_db
DB_USER=vichet
DB_PASS=change_me
# Example DSN (adjust to your backend's expectation):
DATABASE_URL="${DB_USER}:${DB_PASS}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?parseTime=true"
EOF
fi

# Set ownership and permissions
chown -R ${SERVICE_USER}:${SERVICE_GROUP} "$WORKDIR" || true
chmod 0644 "$ENV_FILE" || true
chmod +x "$EXEC_PATH" || true

UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
log "Writing systemd unit to ${UNIT_PATH}"
cat > "$UNIT_PATH" <<EOF
[Unit]
Description=Achieving Go Backend Service
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${WORKDIR}
EnvironmentFile=${ENV_FILE}
ExecStart=${EXEC_PATH}
Restart=on-failure
RestartSec=5s
NoNewPrivileges=yes
PrivateTmp=true
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

log "Reloading systemd daemon"
systemctl daemon-reload

log "Enabling service ${SERVICE_NAME} to start on boot"
systemctl enable "${SERVICE_NAME}" || warn "Failed to enable service (it may not exist yet)"

read -p "Start service now? [Y/n]: " _START || true
_START=${_START:-Y}
if [[ "${_START}" != "n" && "${_START}" != "N" ]]; then
  if systemctl start "${SERVICE_NAME}"; then
    log "Service started. Checking status..."
    systemctl status "${SERVICE_NAME}" --no-pager -l || true
    if systemctl is-active --quiet "${SERVICE_NAME}"; then
      log "${SERVICE_NAME} is active and running."
    else
      warn "${SERVICE_NAME} is not active. Check logs: journalctl -u ${SERVICE_NAME} --no-pager"
    fi
  else
    warn "Could not start service. Ensure ExecStart exists and is executable."
  fi
else
  log "Skipped starting service. You can start it later with: systemctl start ${SERVICE_NAME}"
fi

log "Done."

