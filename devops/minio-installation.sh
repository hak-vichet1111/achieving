#!/usr/bin/env bash
set -euo pipefail

log() { echo "[minio-install] $*"; }

# Determine architecture and MinIO download URL
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) MINIO_URL="https://dl.min.io/server/minio/release/linux-amd64/minio" ;;
  aarch64|arm64) MINIO_URL="https://dl.min.io/server/minio/release/linux-arm64/minio" ;;
  *) MINIO_URL="https://dl.min.io/server/minio/release/linux-amd64/minio"; log "Unknown arch $ARCH, defaulting to amd64" ;;
esac

log "Installing prerequisites"
sudo apt-get update -y
sudo apt-get install -y wget

log "Downloading MinIO from $MINIO_URL"
wget -qO /tmp/minio "$MINIO_URL"
chmod +x /tmp/minio
sudo mv /tmp/minio /usr/local/bin/minio

# Create a dedicated service user if missing
if ! id -u minio >/dev/null 2>&1; then
  sudo useradd -r -s /sbin/nologin -U -M minio
fi

# Prepare data and config directories
sudo mkdir -p /mnt/data
sudo chown -R minio:minio /mnt/data
sudo mkdir -p /etc/minio

# Allow overriding defaults via environment when running the script
ROOT_USER=${MINIO_ROOT_USER:-vichet}
ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-12345678} # update at least 8 characters
VOLUMES=${MINIO_VOLUMES:-/mnt/data}
CONSOLE_ADDR=${MINIO_CONSOLE_ADDR:-":9001"}

log "Writing /etc/minio/minio.conf"
sudo tee /etc/minio/minio.conf >/dev/null <<EOF
MINIO_ROOT_USER="$ROOT_USER"
MINIO_ROOT_PASSWORD="$ROOT_PASSWORD"
MINIO_VOLUMES="$VOLUMES"
MINIO_OPTS="--console-address $CONSOLE_ADDR"
EOF

log "Writing systemd unit at /etc/systemd/system/minio.service"
sudo tee /etc/systemd/system/minio.service >/dev/null <<'EOF'
[Unit]
Description=MinIO Object Storage
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
User=minio
Group=minio
EnvironmentFile=/etc/minio/minio.conf
ExecStart=/usr/local/bin/minio server $MINIO_VOLUMES $MINIO_OPTS
WorkingDirectory=/mnt/data
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

log "Reloading systemd and starting MinIO"
sudo systemctl daemon-reload
sudo systemctl enable --now minio
sudo systemctl status minio --no-pager -l || true

log "MinIO installed. Console is available at http://<host>:9001 (set MINIO_CONSOLE_ADDR to change)."