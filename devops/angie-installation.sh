#!/bin/bash
# ========================================================
# 🚀 Angie Web Server Automated Installer for Debian 12
# ========================================================
# Author: Hak Vichet
# Description: Automatically installs and configures Angie web server
# ========================================================

set -e

# --- 🎨 Colors ---
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
RESET="\033[0m"

# --- ⚙️ Step header ---
step() {
  echo -e "\n${BLUE}==> $1${RESET}"
}

success() {
  echo -e "${GREEN}✔ $1${RESET}"
}

warn() {
  echo -e "${YELLOW}⚠ $1${RESET}"
}

error_exit() {
  echo -e "${RED}✖ $1${RESET}"
  exit 1
}

# --- 🧱 Check root ---
if [ "$EUID" -ne 0 ]; then
  error_exit "Please run as root (use sudo)."
fi

# --- 🕓 Step 1: Update system ---
step "Updating system packages..."
# Proactively disable any stale Angie repo entries that could break apt update
if ls /etc/apt/sources.list.d/* 1>/dev/null 2>&1; then
  for f in /etc/apt/sources.list.d/*; do
    if grep -Eq "angie\.software|packages\.angie\.software" "$f"; then
      warn "Disabling stale Angie repo in $f"
      sed -i.bak '/angie\.software/d;/packages\.angie\.software/d' "$f"
    fi
  done
fi
apt update -y && apt upgrade -y
success "System updated successfully."

# --- 🌐 Step 2: Add Angie repository ---
step "Adding Angie repository..."
apt install -y curl gnupg ca-certificates lsb-release apt-transport-https

# Determine Debian codename dynamically (e.g., bookworm for Debian 12)
CODENAME="$(lsb_release -sc 2>/dev/null || . /etc/os-release 2>/dev/null && echo "$VERSION_CODENAME")"
[ -z "$CODENAME" ] && CODENAME="bookworm"

# Prepare keyring path
KEYRING="/usr/share/keyrings/angie.gpg"
mkdir -p "$(dirname "$KEYRING")"

# Try multiple key URLs for resilience
KEY_URLS=(
  "https://angie.software/keys/angie-signing.gpg"
  "https://packages.angie.software/keys/angie-signing.gpg"
)

KEY_FETCHED="false"
for url in "${KEY_URLS[@]}"; do
  if curl -fsSL "$url" | gpg --dearmor > "$KEYRING"; then
    KEY_FETCHED="true"
    success "Imported Angie signing key from $url"
    break
  fi
done

if [ "$KEY_FETCHED" != "true" ]; then
  warn "Failed to fetch Angie signing key from known locations. Will attempt Nginx fallback."
fi

# Validate available repository endpoints and pick one that exposes a Release file
REPO_BASE_CANDIDATES=(
  "https://angie.software/angie/debian"
  "https://packages.angie.software/angie/debian"
)
SUITE_CANDIDATES=("$CODENAME" "stable" "bookworm" "bullseye")

REPO_BASE=""
SUITE=""
for base in "${REPO_BASE_CANDIDATES[@]}"; do
  for suite in "${SUITE_CANDIDATES[@]}"; do
    if curl -fsSI "$base/dists/$suite/Release" >/dev/null; then
      REPO_BASE="$base"; SUITE="$suite"
      success "Angie repo endpoint reachable: $base (suite: $suite)"
      break 2
    fi
  done
done

INSTALL_FLAVOR="angie"
if [ -z "$REPO_BASE" ] || [ -z "$SUITE" ]; then
  INSTALL_FLAVOR="nginx"
  warn "No valid Angie apt repository found for '$CODENAME'. Falling back to Nginx from Debian repos."
else
  echo "deb [signed-by=$KEYRING] $REPO_BASE $SUITE main" > /etc/apt/sources.list.d/angie.list
  apt update -y
  success "Angie repository added successfully."
fi

# --- 🧩 Step 3: Install web server ---
if [ "$INSTALL_FLAVOR" = "angie" ]; then
  step "Installing Angie web server..."
  apt install -y angie
  systemctl enable angie
  systemctl start angie
  success "Angie installed and started."
else
  step "Installing Nginx web server (fallback)..."
  apt install -y nginx
  # Create systemd alias so service name 'angie' works with existing tooling
  ln -sf /lib/systemd/system/nginx.service /etc/systemd/system/angie.service
  systemctl daemon-reload
  systemctl enable nginx
  systemctl start nginx
  success "Nginx installed and started (angie alias created)."
fi

# --- ⚙️ Step 4: Configure default site ---
step "Configuring web server default site..."

mkdir -p /var/www/achieving
if [ "$INSTALL_FLAVOR" = "angie" ]; then
cat <<'EOF' > /etc/angie/http.d/default.conf
server {
    listen       80;
    server_name  62.146.233.58;
    
    # Manage log
    access_log /var/log/angie/access.log;
    error_log /var/log/angie/error.log;

    location / {
        root /var/www/achieving;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to backend service listening on PORT=8080
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

}
EOF

else
rm -f /etc/nginx/sites-enabled/default || true
cat <<'EOF' > /etc/nginx/conf.d/achieving.conf
server {
    listen       80;
    server_name  62.146.233.58;

    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log;

    location / {
        root /var/www/achieving;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
fi

echo "<h1>🚀 Web server is running successfully on Debian $(lsb_release -sr 2>/dev/null || echo 12)!</h1>" > /var/www/achieving/index.html
if [ "$INSTALL_FLAVOR" = "angie" ]; then
  systemctl reload angie
  success "Angie configuration complete."
else
  systemctl reload nginx
  success "Nginx configuration complete (angie alias present)."
fi

# --- 🧾 Step 5: Setup logrotate ---
step "Setting up log rotation..."
if [ "$INSTALL_FLAVOR" = "angie" ]; then
cat <<'EOF' > /etc/logrotate.d/angie
/var/log/angie/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 www-data adm
    sharedscripts
    postrotate
        systemctl reload angie > /dev/null 2>/dev/null || true
    endscript
}
EOF
else
cat <<'EOF' > /etc/logrotate.d/nginx-achieving
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>/dev/null || true
    endscript
}
EOF
fi
success "Log rotation configured."

# --- ✅ Final Step ---
step "Final check..."
systemctl status angie --no-pager | grep "active (running)" >/dev/null && \
    success "Angie (or Nginx via alias) is active and running!" || warn "Service might need to be checked manually."

echo -e "\n${GREEN}🎉 Installation completed!${RESET}"
echo -e "Visit: ${YELLOW}http://$(hostname -I | awk '{print $1}')${RESET} to test Angie."

