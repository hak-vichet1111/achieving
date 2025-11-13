#!/bin/bash
set -euo pipefail

# Should be work on debain latest version 

# === Config ===
DB_NAME="achieving_db"
USER1="vichet"
# USER2="devops"
MYSQL_ROOT_PASSWORD=""
USER_PASSWORD=""
MYSQL_APT_PKG="mysql-apt-config_0.8.36-1_all.deb" 
# check latest version on https://dev.mysql.com/downloads/repo/apt/

# === Logging (stdout only) ===
log() { echo -e "\e[32m[INFO] $*\e[0m"; }
warn() { echo -e "\e[33m[WARN] $*\e[0m"; }
error() { echo -e "\e[31m[ERROR] $*\e[0m"; exit 1; }

# === DNS Fallback ===
# log "Checking internet connectivity..."
# if ! ping -c1 -W2 deb.debian.org &>/dev/null; then
#     warn "DNS resolution failed. Setting fallback DNS to 8.8.8.8..."
#     echo "nameserver 8.8.8.8" > /etc/resolv.conf
# fi

# === Prepare system ===
log "Installing prerequisites..."
apt-get update -y
apt-get install -y wget gnupg lsb-release debconf-utils || error "Failed to install prerequisites"

# === Download and install MySQL APT repo ===
log "Downloading MySQL APT config..."
cd /tmp
wget -q "https://dev.mysql.com/get/${MYSQL_APT_PKG}" || error "Failed to download MySQL APT config"

log "Installing MySQL APT config..."
DEBIAN_FRONTEND=noninteractive dpkg -i "${MYSQL_APT_PKG}" || error "Failed to install MySQL APT config"

log "Updating package index after adding MySQL repo..."
apt-get update -y

# === Install MySQL Server ===
log "Installing mysql-server..."
DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server || error "Failed to install mysql-server"

# === Verify and start MySQL service ===
log "Ensuring MySQL service is enabled and running..."
systemctl daemon-reload || true
if ! systemctl enable --now mysql >/dev/null 2>&1; then
  warn "Service 'mysql' not found. Trying 'mysqld'..."
  systemctl enable --now mysqld || error "Failed to enable/start MySQL service"
fi

if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
  log "MySQL service is active."
else
  error "MySQL service failed to start. Check logs: journalctl -u mysql --no-pager"
fi

# === Prompt for credentials (after successful install) ===
echo ""
echo "MySQL setup prompts:"
read -p "Database name [${DB_NAME}]: " _DB_NAME_INPUT || true
DB_NAME=${_DB_NAME_INPUT:-$DB_NAME}

read -p "App DB username [${USER1}]: " _USER1_INPUT || true
USER1=${_USER1_INPUT:-$USER1}

while true; do
  read -s -p "MySQL root password: " MYSQL_ROOT_PASSWORD; echo
  read -s -p "Confirm MySQL root password: " _CONFIRM; echo
  [ "$MYSQL_ROOT_PASSWORD" = "$_CONFIRM" ] && break
  warn "Passwords do not match. Please try again."
done

while true; do
  read -s -p "App user password for '${USER1}': " USER_PASSWORD; echo
  read -s -p "Confirm app user password: " _CONFIRM2; echo
  [ "$USER_PASSWORD" = "$_CONFIRM2" ] && break
  warn "Passwords do not match. Please try again."
done

# === Configure root password ===
log "Configuring root user password..."
# Try via socket auth first (typical on Debian after install)
if mysql -e "SELECT 1;" >/dev/null 2>&1; then
  mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}'; FLUSH PRIVILEGES;" \
    || error "Failed to set root password via socket"
else
  warn "Socket auth for root not available; verifying supplied root password..."
  if mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1;" >/dev/null 2>&1; then
    log "Root password appears already set and valid."
  else
    error "Could not set or verify root password. Try: sudo mysql -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY '<pass>'\""
  fi
fi

# === Create DB and users ===
log "Creating database '${DB_NAME}' and users..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
CREATE USER IF NOT EXISTS '${USER1}'@'localhost' IDENTIFIED BY '${USER_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${USER1}'@'localhost';

FLUSH PRIVILEGES;
EOF

log "✅ MySQL installation and setup completed successfully."


# === Cleanup ===
# sudo apt purge mysql-apt-config
# sudo apt purge mysql-server mysql-client mysql-common
# sudo rm /etc/apt/sources.list.d/mysql.list